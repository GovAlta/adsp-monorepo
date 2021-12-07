export interface Subscription {
  id: string;
  urn?: string;
}

export interface Subscriber {
  id: string;
  channels: string;
  urn?: string;
}

export interface SubscriberService {
  subscription: Subscription;
  subscriber: Subscriber;
  successMessage: string;
  subscriptionTypes: any;
}

export const SUBSCRIBER_INIT: SubscriberService = {
  subscription: undefined,
  subscriber: undefined,
  successMessage: null,
  subscriptionTypes: null,
};
