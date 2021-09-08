import { QueueEntity } from '../model/queue';

export * from './definition';
export * from './task';
export * from './queue';

export interface TaskServiceConfiguration {
  queues: Record<string, QueueEntity>;
}
