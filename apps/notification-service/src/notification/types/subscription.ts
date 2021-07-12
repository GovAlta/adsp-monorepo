import { AdspId } from '@abgov/adsp-service-sdk';

export interface SubscriptionCriteria {
  correlationId?: string;
  context?: {
    [key: string]: unknown;
  };
}

export interface Subscription {
  tenantId: AdspId;
  typeId: string;
  criteria: SubscriptionCriteria;
  subscriberId: string;
}
