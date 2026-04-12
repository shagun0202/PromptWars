export interface RedisAdapter {
    /** 
     * Adds an element to the sorted set stored at key with the specified score.
     * Returns the 0-based rank of the added element.
     */
    zadd(key: string, score: number, member: string): Promise<number>;
    
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
}

export interface NotificationService {
    sendToUser(userId: string, message: any): Promise<void>;
}
