import { RedisAdapter } from 'nexusflow-core/src/interfaces/Adapters';

export class InMemoryRedisClient implements RedisAdapter {
    private store: Map<string, string> = new Map();
    // Simulate Sorted Set for ZADD
    private zStore: Map<string, Array<{score: number, member: string}>> = new Map();

    async zadd(key: string, score: number, member: string): Promise<number> {
        if (!this.zStore.has(key)) {
            this.zStore.set(key, []);
        }
        
        const set = this.zStore.get(key)!;
        set.push({ score, member });
        // Sort by score ascending
        set.sort((a, b) => a.score - b.score);
        
        // Return 0-indexed position
        return set.findIndex(item => item.member === member);
    }

    async get(key: string): Promise<string | null> {
        return this.store.get(key) || null;
    }

    async set(key: string, value: string): Promise<void> {
        this.store.set(key, value);
    }
}
