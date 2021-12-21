export interface Subscription {
  id: string;
  subscriberId?: string;
  tenantId?: string;
  typeId?: string;
  urn?: string;
}

export interface SubscriptionWrapper {
  subscriber?: Subscriber;
  subscriberId?: string;
  typeId?: string;
  criterial?: string;
}

export interface Channels {
  address?: string;
  channel?: string;
  verified?: boolean;
}

export interface Subscriber {
  id: string;
  urn?: string;
  addressAs?: string;
  channels?: Channels[];
  userId?: string;
}

export interface SubscriberService {
  subscription: Subscription;
  subscriptions: SubscriptionWrapper[];
  subscriber: Subscriber;
  successMessage: string;
}

export const SUBSCRIBER_INIT: SubscriberService = {
  subscription: undefined,
  subscriptions: undefined,
  subscriber: undefined,
  successMessage: null,
};
