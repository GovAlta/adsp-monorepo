export interface Subscription {
  subscriberId: string;
  typeId: string;
  criteria: SubscriptionCriteria;
  type: SubscriptionType;
  subscriber?: Subscriber;
}

export interface SubscriptionCriteria {
  correlationId?: string;
  context?: {
    [key: string]: unknown;
  };
}
export interface SubscriptionType {
  description: string;
  id: string;
  name: string;
  manageSubscribe: boolean;
  canSubscribe: boolean;
}
export interface SubscriberChannel {
  address: string;
  channel: string;
  verified?: boolean;
}
export interface Subscriber {
  tenantId?: string;
  id: string;
  channels: SubscriberChannel[];
  addressAs: string;
  urn?: string;
  userId?: string;
  subscriptions?: Subscription[];
  tenantId?: TenantId;
}
export interface SubscriberService {
  subscriber: Subscriber;
  subscriptions: Subscription[];
  hasSubscriberId: boolean;
}

export const SUBSCRIBER_INIT: SubscriberService = {
  subscriber: undefined,
  subscriptions: [],
  hasSubscriberId: true,
};
