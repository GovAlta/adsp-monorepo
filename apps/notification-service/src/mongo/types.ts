import { Doc } from '@core-services/core-common';
import { Subscriber, Subscription } from '../notification';

export type SubscriberDoc = Doc<Omit<Subscriber, 'tenantId' | 'id'> & { tenantId: string }>;
export type SubscriptionDoc = Doc<Omit<Subscription, 'tenantId'> & { tenantId: string }>;
