export class VirtualQueue {
    constructor(
        public queueId: string,
        public targetId: string,
        public currentWaitTimeMs: number,
        public activeUsers: Set<string>
    ) {}
}
