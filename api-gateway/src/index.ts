import express from 'express';
import cors from 'cors';
import { JoinQueueUseCase } from 'nexusflow-core/src/usecases/JoinQueueUseCase';
import { InMemoryRedisClient } from './infrastructure/RedisClient';
import { ConsoleFCMService } from './infrastructure/FCMService';

const app = express();
app.use(express.json());
app.use(cors());

// Dependency Injection 
const redisClient = new InMemoryRedisClient();
const fcmService = new ConsoleFCMService();
const joinQueueUseCase = new JoinQueueUseCase(redisClient, fcmService);

app.post('/api/queue/join', async (req, res) => {
    try {
        const { userId, targetId } = req.body;
        if (!userId || !targetId) {
            return res.status(400).json({ error: 'userId and targetId are required' });
        }

        const waitTimeMs = await joinQueueUseCase.execute(userId, targetId);
        res.json({ success: true, waitTimeMs });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
});
