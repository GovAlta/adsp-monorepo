import { Observable } from 'rxjs';

export interface DomainEvent {
  namespace: string;
  name: string;
  timestamp: Date;
  correlationId?: string;
  context?: {
    [key: string]: boolean | number | string;
  };
  [key: string]: unknown;
}

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
  getEvents(): Observable<DomainEventWorkItem>;
}
