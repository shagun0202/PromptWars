/**
 * @fileoverview Unit tests for JoinQueueUseCase.
 *
 * Covers:
 *   - Input validation (null, empty, whitespace-only strings)
 *   - Successful queue enrollment and wait-time calculation
 *   - Redis connection timeout handling
 *   - Notification dispatch verification
 *   - Analytics event logging verification
 */

import { JoinQueueUseCase } from '../src/usecases/JoinQueueUseCase';
import {
    RedisAdapter,
    NotificationService,
    AnalyticsService,
    QueueNotificationPayload,
} from '../src/interfaces/Adapters';

describe('JoinQueueUseCase', () => {
    let mockRedis: jest.Mocked<RedisAdapter>;
    let mockNotifier: jest.Mocked<NotificationService>;
    let mockAnalytics: jest.Mocked<AnalyticsService>;
    let useCase: JoinQueueUseCase;

    beforeEach(() => {
        mockRedis = {
            zadd: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
        };
        mockNotifier = {
            sendToUser: jest.fn(),
        };
        mockAnalytics = {
            logEvent: jest.fn(),
        };
        useCase = new JoinQueueUseCase(mockRedis, mockNotifier, mockAnalytics);
    });

    // -----------------------------------------------------------------------
    // Input Validation
    // -----------------------------------------------------------------------
    describe('input validation', () => {
        it('should reject empty userId', async () => {
            await expect(useCase.execute('', 'RESTROOM_A')).rejects.toThrow('Invalid parameters');
        });

        it('should reject empty targetId', async () => {
            await expect(useCase.execute('user_1', '')).rejects.toThrow('Invalid parameters');
        });

        it('should reject whitespace-only userId', async () => {
            await expect(useCase.execute('   ', 'GATE_A')).rejects.toThrow('Invalid parameters');
        });

        it('should reject null inputs', async () => {
            // @ts-ignore — deliberately testing runtime null safety
            await expect(useCase.execute(null, null)).rejects.toThrow('Invalid parameters');
        });

        it('should reject undefined inputs', async () => {
            // @ts-ignore — deliberately testing runtime undefined safety
            await expect(useCase.execute(undefined, 'GATE_A')).rejects.toThrow('Invalid parameters');
        });
    });

    // -----------------------------------------------------------------------
    // Successful queue enrollment
    // -----------------------------------------------------------------------
    describe('successful enrollment', () => {
        it('should enqueue and return correct wait time', async () => {
            mockRedis.zadd.mockResolvedValue(10);
            mockNotifier.sendToUser.mockResolvedValue();
            mockAnalytics.logEvent.mockResolvedValue();

            const result = await useCase.execute('user_42', 'CONCESSION_B');

            expect(mockRedis.zadd).toHaveBeenCalledWith(
                'queue:CONCESSION_B',
                expect.any(Number),
                'user_42'
            );
            expect(result.position).toBe(10);
            expect(result.estimatedWaitMs).toBe((10 / 5) * 120_000);
            expect(result.queueKey).toBe('queue:CONCESSION_B');
        });

        it('should calculate zero wait time for first-in-line', async () => {
            mockRedis.zadd.mockResolvedValue(0);
            mockNotifier.sendToUser.mockResolvedValue();
            mockAnalytics.logEvent.mockResolvedValue();

            const result = await useCase.execute('user_first', 'GATE_A');

            expect(result.position).toBe(0);
            expect(result.estimatedWaitMs).toBe(0);
        });
    });

    // -----------------------------------------------------------------------
    // Notification dispatch
    // -----------------------------------------------------------------------
    describe('notification dispatch', () => {
        it('should send push notification with correct payload', async () => {
            mockRedis.zadd.mockResolvedValue(3);
            mockNotifier.sendToUser.mockResolvedValue();
            mockAnalytics.logEvent.mockResolvedValue();

            await useCase.execute('user_99', 'RESTROOM_A');

            expect(mockNotifier.sendToUser).toHaveBeenCalledWith('user_99', {
                type: 'QUEUE_UPDATE',
                position: 3,
                estimatedWait: (3 / 5) * 120_000,
            });
        });
    });

    // -----------------------------------------------------------------------
    // Analytics logging
    // -----------------------------------------------------------------------
    describe('analytics logging', () => {
        it('should log queue_join event with metadata', async () => {
            mockRedis.zadd.mockResolvedValue(1);
            mockNotifier.sendToUser.mockResolvedValue();
            mockAnalytics.logEvent.mockResolvedValue();

            await useCase.execute('user_7', 'ELEVATOR_1');

            expect(mockAnalytics.logEvent).toHaveBeenCalledWith('queue_join', {
                userId: 'user_7',
                targetId: 'ELEVATOR_1',
                position: '1',
                timestamp: expect.any(String),
            });
        });
    });

    // -----------------------------------------------------------------------
    // Error boundaries
    // -----------------------------------------------------------------------
    describe('error handling', () => {
        it('should propagate Redis connection timeout', async () => {
            mockRedis.zadd.mockRejectedValue(new Error('Connection Timeout'));

            await expect(useCase.execute('user_1', 'GATE_A')).rejects.toThrow('Connection Timeout');
        });

        it('should propagate notification service failure', async () => {
            mockRedis.zadd.mockResolvedValue(0);
            mockNotifier.sendToUser.mockRejectedValue(new Error('FCM Unavailable'));

            await expect(useCase.execute('user_1', 'GATE_A')).rejects.toThrow('FCM Unavailable');
        });
    });
});
