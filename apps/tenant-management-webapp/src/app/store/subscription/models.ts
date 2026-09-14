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
  criteria?: string;
}

export interface SubscriberSubscriptions {
  subscriberId?: string;
  typeId?: string;
  criteria?: string;
  type: {
    channels: Channels[];
    description: string;
    id: string;
    manageSubscribe: boolean;
    name: string;
    publicSubscriber: boolean;
  };
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
  created?: string;
  updated?: string;
}

export type TypeSubscriptionSubscriber = Pick<Subscriber, 'id'> | Omit<Subscriber, 'id'>;

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
    total: number;
  };
  typeSubscriptionSearch: Record<
    string,
    {
      results: string[];
      next: string;
    }
  >;
  successMessage: string;
  updateError: string;
  subscriptionCreation: {
    state: 'idle' | 'loading' | 'succeeded' | 'failed';
  };
}

export const SUBSCRIBER_INIT: SubscriberService = {
  subscribers: {},
  subscriptions: {},
  subscriberSearch: {
    results: null,
    next: null,
    total: 0,
  },
  typeSubscriptionSearch: {},
  successMessage: null,
  updateError: '',
  subscriptionCreation: {
    state: 'idle',
  },
};

export const SUBSCRIBER_SORT_COLUMNS = ['name', 'email', 'sms', 'verified'] as const;

export type SubscriberSortColumn = (typeof SUBSCRIBER_SORT_COLUMNS)[number];

export type SubscriberSortDirection = 'asc' | 'desc';

export interface SubscriberSort {
  column: SubscriberSortColumn;
  direction: SubscriberSortDirection;
}

// The heading each column carries in the table.
export const SUBSCRIBER_COLUMN_LABELS: Record<SubscriberSortColumn, string> = {
  name: 'Name / Address as',
  email: 'Email',
  sms: 'Phone',
  verified: 'Verification status',
};

// The shorter name each column goes by in the sort dropdown, where it is read with a direction
// after it rather than as a heading over a column of values.
export const SUBSCRIBER_SORT_LABELS: Record<SubscriberSortColumn, string> = {
  name: 'Name',
  email: 'Email',
  sms: 'Phone',
  verified: 'Verification status',
};

export const DEFAULT_SUBSCRIBER_SORT: SubscriberSort = { column: 'name', direction: 'asc' };

export interface SubscriberSearchCriteria {
  email?: string;
  name?: string;
  next?: string;
  sms?: string;
  // A single value matched against the name, email address, and phone number of a subscriber.
  search?: string;
  sort?: SubscriberSort;
  reset?: boolean;
  paginationReset?: boolean;
  top?: number;
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
