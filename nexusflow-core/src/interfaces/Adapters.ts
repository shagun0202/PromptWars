/**
 * @fileoverview Strict port contracts for infrastructure adapters.
 * These interfaces define the dependency inversion boundary between
 * the domain use-cases and the external infrastructure (Redis, FCM, Firestore).
 * No implementation details leak into the domain layer.
 */

/** Structured payload for FCM push notifications. */
export interface QueueNotificationPayload {
    type: 'QUEUE_UPDATE' | 'SOS_DISPATCH' | 'GATE_CHANGE';
    position: number;
    estimatedWait: number;
}

/** Return type for queue join operations. */
export interface QueueJoinResult {
    position: number;
    estimatedWaitMs: number;
    queueKey: string;
}

/** Port: Cache adapter for sorted-set queue operations. */
export interface RedisAdapter {
    /**
     * Adds an element to the sorted set stored at key with the specified score.
     * @returns The 0-based rank of the added element.
     */
    zadd(key: string, score: number, member: string): Promise<number>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
}

/** Port: Push notification delivery service. */
export interface NotificationService {
    sendToUser(userId: string, message: QueueNotificationPayload): Promise<void>;
}

/** Port: Analytics event logging service. */
export interface AnalyticsService {
    logEvent(eventName: string, metadata: Record<string, string>): Promise<void>;
}
