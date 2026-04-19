/**
 * @fileoverview In-memory Redis adapter implementing the RedisAdapter port.
 *
 * In production, this would connect to a Cloud Memorystore (Redis) instance
 * via the REDIS_URL environment variable injected from Google Secret Manager.
 * Locally, it simulates sorted-set operations with native Map structures.
 */

import { RedisAdapter } from 'nexusflow-core/src/interfaces/Adapters';

interface SortedSetEntry {
    score: number;
    member: string;
}

/**
 * Simulates a Redis sorted-set cache using native JavaScript Maps.
 * Provides O(n log n) ranked insertion for virtual queue positioning.
 */
export class InMemoryRedisClient implements RedisAdapter {
    private readonly store: Map<string, string> = new Map();
    private readonly sortedSets: Map<string, SortedSetEntry[]> = new Map();

    /**
     * Adds a member to the sorted set at `key` with the given `score`.
     * @returns The 0-based rank (position) of the member after insertion.
     */
    async zadd(key: string, score: number, member: string): Promise<number> {
        if (!this.sortedSets.has(key)) {
            this.sortedSets.set(key, []);
        }

        const entries = this.sortedSets.get(key)!;
        entries.push({ score, member });
        entries.sort((a, b) => a.score - b.score);

        return entries.findIndex((entry) => entry.member === member);
    }

    async get(key: string): Promise<string | null> {
        return this.store.get(key) ?? null;
    }

    async set(key: string, value: string): Promise<void> {
        this.store.set(key, value);
    }
}
