import { RedisAdapter, NotificationService } from '../interfaces/Adapters';

export class JoinQueueUseCase {
    constructor(
        private cache: RedisAdapter, 
        private msgQueue: NotificationService
    ) {}

    async execute(userId: string, targetId: string): Promise<number> {
        // High-efficiency Redis-backed atomic queue addition
        const queueKey = `queue:${targetId}`;
        const timestamp = Date.now();
        // ZADD usually returns items added, but we need the rank.
        // For simplicity, zadd adapter here abstracts returning their physical position in the queue.
        const queuePosition = await this.cache.zadd(queueKey, timestamp, userId);
        
        // Extrapolate Wait Time (e.g., 2 mins per 5 users)
        const waitTimeMs = (queuePosition / 5) * 120000; 
        
        // Trigger Async Update via FCM for real-time coordination
        await this.msgQueue.sendToUser(userId, {
            type: 'QUEUE_UPDATE',
            position: queuePosition,
            estimatedWait: waitTimeMs
        });

        return waitTimeMs;
    }
}
