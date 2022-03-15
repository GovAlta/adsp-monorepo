export interface Subscription {
  subscriberId: string;
  typeId: string;
  criteria: SubscriptionCriteria;
  type: SubscriptionType;
  subscriber?: Subscriber;
  tenantId?: TenantId;
}

export interface TenantId {
  type: string;
  namespace: string;
  service: string;
  api: string;
  resource: string;
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
  id: string;
  channels: SubscriberChannel[];
  addressAs: string;
  urn?: string;
  userId?: string;
  subscriptions?: Subscription[];
}
export interface SubscriberService {
  subscriber: Subscriber;
  subscriptions: Subscription[];
  hasSubscriberId: boolean;
}

export const SUBSCRIBER_INIT: SubscriberService = {
  subscriber: undefined,
  subscriptions: undefined,
  hasSubscriberId: true,
};
