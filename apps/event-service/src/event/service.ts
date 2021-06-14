import type { Subscribable } from 'rxjs';
import { DomainEvent } from './types';

export interface DomainEventService {
  isConnected(): boolean;
  send(event: DomainEvent): void;
}

export interface DomainEventWorkItem {
  event: DomainEvent;
  done: (err?: unknown) => void;
}

export interface DomainEventSubscriberService {
  isConnected(): boolean;
  getEvents(): Subscribable<DomainEventWorkItem>;
}
