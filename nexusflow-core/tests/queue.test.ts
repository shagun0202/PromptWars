import { JoinQueueUseCase } from '../src/usecases/JoinQueueUseCase';
import { RedisAdapter, NotificationService } from '../src/interfaces/Adapters';

describe('JoinQueueUseCase Edge Cases & Validation', () => {
    let mockRedis: jest.Mocked<RedisAdapter>;
    let mockNotification: jest.Mocked<NotificationService>;
    let useCase: JoinQueueUseCase;

    beforeEach(() => {
        mockRedis = {
            zadd: jest.fn(),
            zrank: jest.fn()
        };
        mockNotification = {
            sendPushNotification: jest.fn()
        };
        useCase = new JoinQueueUseCase(mockRedis, mockNotification);
    });

    it('should throw an error if targetQueue or userId is null or empty', async () => {
        // Edge Case: Null Inputs
        await expect(useCase.execute('', 'user123')).rejects.toThrow('Invalid parameters');
        await expect(useCase.execute('RESTROOM_A', '')).rejects.toThrow('Invalid parameters');
        // @ts-ignore testing missing params
        await expect(useCase.execute(null, null)).rejects.toThrow('Invalid parameters');
    });

    it('should successfully add a user to the queue and calculate wait time', async () => {
        mockRedis.zadd.mockResolvedValue(true);
        mockRedis.zrank.mockResolvedValue(5); // 5th in line

        const result = await useCase.execute('CONCESSION_B', 'user_999');
        
        expect(mockRedis.zadd).toHaveBeenCalledWith('queue:CONCESSION_B', expect.any(Number), 'user_999');
        expect(mockRedis.zrank).toHaveBeenCalledWith('queue:CONCESSION_B', 'user_999');
        
        // Ensure wait time is calculated (5 * 120000)
        expect(result.estimatedWaitMs).toBe(600000);
        expect(result.position).toBe(5);
    });

    it('should handle timeout boundaries if redis fails', async () => {
        mockRedis.zadd.mockRejectedValue(new Error('Connection Timeout'));
        
        await expect(useCase.execute('GATE_A', 'user_001')).rejects.toThrow('Connection Timeout');
    });
});
