import { AdspId } from '@abgov/adsp-service-sdk';
import { SubscriberCriteria } from './subscriber';

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

export interface SubscriptionSearchCriteria {
  typeIdEquals?: string;
  subscriberIdEquals?: string;
  subscriberCriteria?: SubscriberCriteria;
}
