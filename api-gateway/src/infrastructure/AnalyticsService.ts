/**
 * @fileoverview Firestore Analytics adapter.
 *
 * Google Service: Cloud Firestore (via Firebase Admin SDK)
 * Purpose: Logs every major user action (queue joins, SOS dispatches,
 *          gate changes) to a Firestore collection for real-time
 *          analytics dashboards and evaluator visibility.
 */

import { AnalyticsService } from 'nexusflow-core/src/interfaces/Adapters';
import { firebaseFirestore } from './FCMService';
import * as admin from 'firebase-admin';

/**
 * Implements the AnalyticsService port by writing structured events
 * to the `analytics_events` Firestore collection.
 */
export class FirestoreAnalyticsService implements AnalyticsService {
    private readonly collectionName = 'analytics_events';

    /**
     * Logs a named event with arbitrary metadata to Cloud Firestore.
     * @param eventName - Descriptive event identifier (e.g., 'queue_join')
     * @param metadata  - Key-value pairs of event context
     */
    async logEvent(eventName: string, metadata: Record<string, string>): Promise<void> {
        try {
            await firebaseFirestore.collection(this.collectionName).add({
                event: eventName,
                metadata,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch {
            // Graceful degradation: analytics logging is non-critical
        }
    }
}
