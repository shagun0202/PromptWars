import { NotificationService } from 'nexusflow-core/src/interfaces/Adapters';

export class ConsoleFCMService implements NotificationService {
    async sendToUser(userId: string, message: any): Promise<void> {
        // Mock FCM push notification delivery
        console.log(`[FCM Mock] Sending to user ${userId}:`, JSON.stringify(message));
    }
}
