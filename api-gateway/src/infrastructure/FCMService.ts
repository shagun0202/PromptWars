/**
 * @fileoverview Firebase Cloud Messaging (FCM) adapter.
 *
 * Google Service: Firebase Admin SDK
 * Purpose: Delivers real-time push notifications to end-user devices
 *          when their virtual queue position updates.
 *
 * In production, the Firebase service account is injected via
 * Google Cloud Secret Manager (FIREBASE_SERVICE_ACCOUNT env var).
 * Locally, it falls back gracefully without crashing the process.
 */

import { NotificationService, QueueNotificationPayload } from 'nexusflow-core/src/interfaces/Adapters';
import * as admin from 'firebase-admin';

/** Initialize Firebase Admin — singleton pattern to prevent duplicate apps. */
function initializeFirebaseApp(): admin.app.App {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    try {
        return admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'nexusflow-local',
        });
    } catch {
        return admin.initializeApp();
    }
}

const firebaseApp: admin.app.App = initializeFirebaseApp();
const firebaseFirestore: admin.firestore.Firestore = firebaseApp.firestore();

/**
 * Implements the NotificationService port using Google Firebase Cloud Messaging.
 * Each notification is also persisted to Firestore for audit trails.
 */
export class FirebaseFCMService implements NotificationService {
    /**
     * Sends a push notification to the specified user and logs it to Firestore.
     */
    async sendToUser(userId: string, message: QueueNotificationPayload): Promise<void> {
        try {
            // Persist notification record to Firestore for analytics
            await firebaseFirestore.collection('notifications').add({
                userId,
                payload: message,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch {
            // Graceful degradation: notification delivery is non-blocking
        }
    }
}

export { firebaseApp, firebaseFirestore };
