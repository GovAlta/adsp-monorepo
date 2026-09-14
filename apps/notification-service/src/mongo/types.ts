import { Doc } from '@core-services/core-common';
import { Subscriber, Subscription } from '../notification';

// The create and update dates are maintained by the database under its own names, so the document
// carries those rather than the names the subscriber exposes them under.
export type SubscriberDoc = Doc<
  Omit<Subscriber, 'tenantId' | 'id' | 'created' | 'updated'> & {
    tenantId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
>;
export type SubscriptionDoc = Doc<
  Omit<Subscription, 'tenantId' | 'subscriberId'> & { tenantId: string; subscriberId: string | SubscriberDoc }
>;
