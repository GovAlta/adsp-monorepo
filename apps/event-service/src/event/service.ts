import type { Subscribable } from 'rxjs';
import { DomainEvent, EventDefinition } from './types';

export interface DomainEventService {
  isConnected(): boolean;
  send(event: DomainEvent): void;
}

export interface DomainEventWorkItem {
  event: DomainEvent;
  done: () => void;
}

export interface DomainEventSubscriberService {
  isConnected(): boolean;
  getEvents(): Subscribable<DomainEventWorkItem>;
}

export interface ValidationService {
  validate(namespace: string, definition: EventDefinition, value: unknown): boolean;
}
