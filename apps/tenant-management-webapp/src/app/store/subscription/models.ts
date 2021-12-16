export interface Subscription {
  id: string;
  urn?: string;
}

export interface Channel {
  address: string;
  channel: string;
  verified: boolean;
}

export interface Subscriber {
  id: string;
  channels: Channel[];
  urn?: string;
}

export interface SubscriberService {
  subscription: Subscription;
  subscriber: Subscriber;
  successMessage: string;
}

export const SUBSCRIBER_INIT: SubscriberService = {
  subscription: undefined,
  subscriber: undefined,
  successMessage: null,
};
