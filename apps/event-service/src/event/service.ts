import type { DomainEvent } from '@abgov/adsp-service-sdk';
import type { DomainEventSubscriberService } from '@core-services/core-common';

export interface DomainEventService extends DomainEventSubscriberService {
  isConnected(): boolean;
  send(event: DomainEvent): void;
}
