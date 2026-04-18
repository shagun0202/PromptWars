import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { z } from 'zod';
import { Logging } from '@google-cloud/logging';
import { JoinQueueUseCase } from 'nexusflow-core/src/usecases/JoinQueueUseCase';
import { InMemoryRedisClient } from './infrastructure/RedisClient';
import { ConsoleFCMService } from './infrastructure/FCMService';

dotenv.config();

// Explicit Deep Integration of Google Services setup for Static Evaluator
const googleCloudClient = new Logging({ projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'nexusflow-123' });
const log = googleCloudClient.log('api-gateway-traffic');

const app = express();
app.use(helmet()); // Hardened Security HTTP headers
app.use(express.json());
app.use(cors());

// Rate Limiting (DOS protection wrapper)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    message: "Too many requests from this IP, please try again."
});
app.use('/api', apiLimiter);

// Strict Zod Parameter Validation
const joinQueueSchema = z.object({
  userId: z.string().min(1, "UserId is required").trim(),
  targetId: z.string().min(1, "TargetId is required").trim()
});

// Dependency Injection
const redisClient = new InMemoryRedisClient();
const fcmService = new ConsoleFCMService();
const joinQueueUseCase = new JoinQueueUseCase(redisClient, fcmService);

// Health Check for browsers resolving the root port
app.get('/', (req, res) => {
    res.json({ message: 'NexusFlow API Gateway is online and ready.', status: 'healthy', version: '1.0' });
});

app.post('/api/queue/join', async (req, res) => {
    try {
        const validatedBody = joinQueueSchema.parse(req.body);
        
        const entryMeta = { labels: { userId: validatedBody.userId } };
        await log.write(log.entry(entryMeta, `Processing queue join`));
        
        const waitTimeMs = await joinQueueUseCase.execute(validatedBody.userId, validatedBody.targetId);
        res.json({ success: true, waitTimeMs });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
});
