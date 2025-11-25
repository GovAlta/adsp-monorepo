import type { Logger } from '@strapi/logger';
interface ConstructorParameters {
    logger: Logger;
    concurrency?: number;
}
type Worker<TPayload, TReturn> = (payload: TPayload) => Promise<TReturn> | TReturn;
export default class WorkerQueue<TPayload, TReturn> {
    logger: Logger;
    worker: Worker<TPayload, TReturn>;
    concurrency: number;
    running: number;
    queue: TPayload[];
    constructor({ logger, concurrency }: ConstructorParameters);
    subscribe(worker: Worker<TPayload, TReturn>): void;
    enqueue(payload: TPayload): void;
    pop(): void;
    execute(payload: TPayload): Promise<void>;
}
export {};
//# sourceMappingURL=worker-queue.d.ts.map