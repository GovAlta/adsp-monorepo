export const DEFAULT_PAGE_SIZE = 10;

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

export interface Criteria {
  correlationId?: unknown;
  context?: unknown;
}

export interface Subscriber {
  id: string;
  urn?: string;
  addressAs?: string;
  channels?: Channels[];
  userId?: string;
  accountLink?: string;
}

export interface HasNext {
  id: string;
  hasNext: boolean;
  top: number;
}

export interface SubscriberService {
  subscribers: Record<string, Subscriber>;
  subscriptions: Record<string, SubscriptionWrapper>;
  subscriberSearch: {
    results: string[];
    next: string;
  };
  typeSubscriptionSearch: Record<
    string,
    {
      results: string[];
      next: string;
    }
  >;
  subscriberSubscriptionSearch: Record<
    string,
    {
      results: string[];
      showHide: boolean;
      next: string;
    }
  >;
  successMessage: string;
  updateError: string;
}

export const SUBSCRIBER_INIT: SubscriberService = {
  subscribers: {},
  subscriptions: {},
  subscriberSearch: {
    results: null,
    next: null,
  },
  typeSubscriptionSearch: {},
  subscriberSubscriptionSearch: {},
  successMessage: null,
  updateError: '',
};

export interface SubscriberSearchCriteria {
  email?: string;
  name?: string;
  next?: string;
  sms?: string;
  reset?: boolean;
}

export interface SubscriptionSearchCriteria {
  email?: string;
  name?: string;
  next?: string;
  sms?: string;
  event?: string;
}

export const Events = {
  search: 'subscription.search.event',
};
