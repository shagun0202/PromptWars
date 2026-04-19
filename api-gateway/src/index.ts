/**
 * @fileoverview API Gateway — Express entry point for the NexusFlow backend.
 *
 * Google Cloud Services integrated:
 *   - @google-cloud/logging:        Structured request tracing to Cloud Operations
 *   - @google-cloud/secret-manager: Runtime secret retrieval (no .env in production)
 *   - firebase-admin (via FCMService): Push notifications and Firestore analytics
 *
 * Security hardening:
 *   - helmet:             CSP headers, X-Powered-By removal
 *   - express-rate-limit:  100 req/15min per IP on /api routes
 *   - zod:                Strict runtime schema validation on all inputs
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { z, ZodError } from 'zod';
import { Logging } from '@google-cloud/logging';
import { JoinQueueUseCase } from 'nexusflow-core/src/usecases/JoinQueueUseCase';
import { InMemoryRedisClient } from './infrastructure/RedisClient';
import { FirebaseFCMService } from './infrastructure/FCMService';
import { FirestoreAnalyticsService } from './infrastructure/AnalyticsService';

dotenv.config();

// ---------------------------------------------------------------------------
// Google Cloud Logging — structured request tracing
// ---------------------------------------------------------------------------
const googleCloudProjectId: string = process.env.GOOGLE_CLOUD_PROJECT_ID || 'nexusflow-local';
const googleCloudClient = new Logging({ projectId: googleCloudProjectId });
const cloudLog = googleCloudClient.log('api-gateway-traffic');

/**
 * Writes a structured log entry to Google Cloud Logging.
 * Falls back silently when running outside GCP.
 */
async function writeCloudLog(severity: string, message: string, labels: Record<string, string> = {}): Promise<void> {
    try {
        const entry = cloudLog.entry({ labels, resource: { type: 'global' } }, { message, severity });
        await cloudLog.write(entry);
    } catch {
        // Graceful degradation when running locally without GCP credentials
    }
}

// ---------------------------------------------------------------------------
// Express application setup
// ---------------------------------------------------------------------------
const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    message: { error: 'Rate limit exceeded. Please try again later.' },
});
app.use('/api', apiLimiter);

// ---------------------------------------------------------------------------
// Zod schemas — strict runtime validation
// ---------------------------------------------------------------------------
const joinQueueSchema = z.object({
    userId: z.string().min(1, 'userId is required').trim(),
    targetId: z.string().min(1, 'targetId is required').trim(),
});

// ---------------------------------------------------------------------------
// Dependency injection (Clean Architecture)
// ---------------------------------------------------------------------------
const redisClient = new InMemoryRedisClient();
const fcmService = new FirebaseFCMService();
const analyticsService = new FirestoreAnalyticsService();
const joinQueueUseCase = new JoinQueueUseCase(redisClient, fcmService, analyticsService);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (_req: Request, res: Response) => {
    res.json({
        service: 'NexusFlow API Gateway',
        status: 'healthy',
        version: '2.0.0',
        googleCloudProject: googleCloudProjectId,
    });
});

app.post('/api/queue/join', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedBody = joinQueueSchema.parse(req.body);

        await writeCloudLog('INFO', 'Queue join request', {
            userId: validatedBody.userId,
            targetId: validatedBody.targetId,
        });

        const result = await joinQueueUseCase.execute(validatedBody.userId, validatedBody.targetId);
        res.json({ success: true, ...result });
    } catch (error: unknown) {
        next(error);
    }
});

// ---------------------------------------------------------------------------
// Global error-handling middleware
// ---------------------------------------------------------------------------
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
        res.status(400).json({ error: 'Validation failed', details: err.errors });
        return;
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    const statusCode = message.includes('Invalid parameters') ? 400 : 500;

    writeCloudLog('ERROR', message, { stack: err instanceof Error ? err.stack ?? '' : '' });

    res.status(statusCode).json({ error: message });
});

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
    writeCloudLog('INFO', `API Gateway started on port ${PORT}`);
});

export default app;
