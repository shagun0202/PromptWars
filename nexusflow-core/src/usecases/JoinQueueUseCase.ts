/**
 * @fileoverview JoinQueueUseCase — Core domain use case for virtual queue enrollment.
 * Implements single-responsibility: validate → enqueue → notify → return.
 * All infrastructure concerns are injected via adapter ports (Dependency Inversion).
 */

import {
    RedisAdapter,
    NotificationService,
    AnalyticsService,
    QueueJoinResult,
    QueueNotificationPayload,
} from '../interfaces/Adapters';

/** Average service time per batch of 5 users, in milliseconds. */
const SERVICE_BATCH_SIZE = 5;
const SERVICE_TIME_PER_BATCH_MS = 120_000;

export class JoinQueueUseCase {
    constructor(
        private readonly cache: RedisAdapter,
        private readonly notifier: NotificationService,
        private readonly analytics: AnalyticsService
    ) {}

    /**
     * Enrolls a user into a virtual queue for a specific target (e.g., concession, restroom).
     * @throws {Error} If userId or targetId is missing or empty.
     */
    async execute(userId: string, targetId: string): Promise<QueueJoinResult> {
        this.validateInputs(userId, targetId);

        const queueKey = `queue:${targetId}`;
        const timestamp = Date.now();

        const queuePosition = await this.cache.zadd(queueKey, timestamp, userId);
        const estimatedWaitMs = this.calculateWaitTime(queuePosition);

        await this.dispatchNotification(userId, queuePosition, estimatedWaitMs);
        await this.recordAnalytics(userId, targetId, queuePosition);

        return { position: queuePosition, estimatedWaitMs, queueKey };
    }

    /** Validates that both required parameters are non-empty strings. */
    private validateInputs(userId: string, targetId: string): void {
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
            throw new Error('Invalid parameters: userId is required');
        }
        if (!targetId || typeof targetId !== 'string' || targetId.trim().length === 0) {
            throw new Error('Invalid parameters: targetId is required');
        }
    }

    /** Extrapolates estimated wait time from queue position. */
    private calculateWaitTime(position: number): number {
        return (position / SERVICE_BATCH_SIZE) * SERVICE_TIME_PER_BATCH_MS;
    }

    /** Dispatches a real-time push notification via FCM. */
    private async dispatchNotification(
        userId: string,
        position: number,
        estimatedWait: number
    ): Promise<void> {
        const payload: QueueNotificationPayload = {
            type: 'QUEUE_UPDATE',
            position,
            estimatedWait,
        };
        await this.notifier.sendToUser(userId, payload);
    }

    /** Records a queue-join event for analytics tracking. */
    private async recordAnalytics(
        userId: string,
        targetId: string,
        position: number
    ): Promise<void> {
        await this.analytics.logEvent('queue_join', {
            userId,
            targetId,
            position: String(position),
            timestamp: new Date().toISOString(),
        });
    }
}
