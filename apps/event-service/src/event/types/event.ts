import type { AdspId, DomainEvent as BaseDomainEvent } from '@abgov/adsp-service-sdk';

export interface DomainEvent extends BaseDomainEvent {
  namespace: string;
  tenantId: AdspId;
}
