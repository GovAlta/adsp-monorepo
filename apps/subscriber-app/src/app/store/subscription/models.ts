export interface Subscription {
  subscriberId: string;
  typeId: string;
  criteria: SubscriptionCriteria;
  type: SubscriptionType;
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
  hasSubscriberId: boolean;
}

export const SUBSCRIBER_INIT: SubscriberService = {
  subscriber: undefined,
  hasSubscriberId: true,
};
