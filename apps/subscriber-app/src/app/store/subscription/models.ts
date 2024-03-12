export interface Subscription {
  subscriberId: string;
  typeId: string;
  criteria: SubscriptionCriteria[];
  type: SubscriptionType;
  subscriber?: Subscriber;
}

export const expireMinutes = 60;

export interface SubscriptionCriteria {
  description?: string;
  correlationId?: string;
  context?: {
    [key: string]: unknown;
  };
}

export type Channel = 'sms' | 'email' | 'bot';

export const Channels = Object.freeze({
  email: 'email',
  sms: 'sms',
  bot: 'bot',
});

export interface SubscriptionType {
  description: string;
  id: string;
  name: string;
  manageSubscribe: boolean;
  canSubscribe: boolean;
  channels: Channel[];
}
export interface SubscriberChannel {
  address: string;
  channel: string;
  verified?: boolean;
  pendingVerification?: boolean;
  timeCodeSent?: number;
}
export interface Subscriber {
  tenantId?: string;
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
  previouslyVerified: Record<string, boolean>;
}

export const SUBSCRIBER_INIT: SubscriberService = {
  subscriber: undefined,
  subscriptions: [],
  hasSubscriberId: true,
  previouslyVerified: {},
};

export const actionTypes = Object.freeze({
  updatePreference: 'update-subscription-preference',
  updateContactInfo: 'update-subscription-contact-info',
});
