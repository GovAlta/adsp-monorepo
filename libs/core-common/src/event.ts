import type { DomainEvent as BaseDomainEvent } from '@abgov/adsp-service-sdk';
import { WorkItem, WorkQueueService } from './work';

export interface DomainEvent extends BaseDomainEvent {
  namespace: string;
}

export type DomainEventWorkItem = WorkItem<DomainEvent>;

export type DomainEventSubscriberService = WorkQueueService<DomainEvent>;
