import { Subscriber, SubscriptionWrapper, SubscriberSearchCriteria, SubscriptionSearchCriteria } from './models';

export const GET_MY_SUBSCRIBER = 'tenant/subscriber-service/get-my-subscriber';
export const GET_MY_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/get-my-subscriber-success';

export const SUBSCRIBE = 'tenant/subscriber-service/subscribe';
export const SUBSCRIBE_SUCCESS = 'tenant/subscriber-service/subscribe-success';
export const UNSUBSCRIBE = 'tenant/subscriber-service/unsubscribe';
export const UNSUBSCRIBE_SUCCESS = 'tenant/subscriber-service/unsubscribe-success';
export const DELETE_SUBSCRIPTION = 'tenant/subscriber-service/delete-subscription';
export const DELETE_SUBSCRIPTION_SUCCESS = 'tenant/subscriber-service/delete-subscription-success';

export const UPDATE_SUBSCRIBER = 'tenant/subscriber-service/update-subscriber';
export const UPDATE_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/update-subscriber-success';

export const GET_ALL_TYPE_SUBSCRIPTIONS = 'tenant/subscriber-service/get-all-type-subscriptions';
export const GET_TYPE_SUBSCRIPTIONS = 'tenant/subscriber-service/get-type-subscription';
export const GET_TYPE_SUBSCRIPTIONS_SUCCESS = 'tenant/subscriber-service/get-type-subscription-success';
export const GET_SUBSCRIBER_SUBSCRIPTIONS = 'tenant/subscriber-service/get-subscription-subscriber';

export const FIND_SUBSCRIBERS = 'tenant/subscriber-service/find-subscribers';
export const FIND_SUBSCRIBERS_SUCCESS = 'tenant/subscriber-service/find-subscribers/success';

export const RESOLVE_SUBSCRIBER_USER = 'tenant/subscriber-service/resolve-subscriber-user';
export const RESOLVE_SUBSCRIBER_USER_SUCCESS = 'tenant/subscriber-service/resolve-subscriber-user-success';

export const DELETE_SUBSCRIBER = 'tenant/subscriber-service/delete-subscriber';
export const DELETE_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/delete-subscriber-success';

// =============
// Actions Types
// =============

export type ActionTypes =
  | SubscribeSuccessAction
  | GetMySubscriberSuccessAction
  | UnsubscribeAction
  | UnsubscribeSuccessAction
  | FindSubscribersAction
  | FindSubscribersSuccessAction
  | UpdateSubscriberSuccessAction
  | GetTypeSubscriptionsSuccessAction
  | ResolveSubscriberUserAction
  | ResolveSubscriberUserSuccessAction
  | DeleteSubscriberSuccessAction
  | DeleteSubscriptionAction
  | DeleteSubscriptionSuccessAction;

export interface GetMySubscriberAction {
  type: typeof GET_MY_SUBSCRIBER;
}

export interface GetMySubscriberSuccessAction {
  type: typeof GET_MY_SUBSCRIBER_SUCCESS;
  payload: {
    subscriberInfo: Subscriber & { subscriptions: SubscriptionWrapper[] };
  };
}

export interface SubscribeAction {
  type: typeof SUBSCRIBE;
  payload: {
    notificationInfo: { data: { type: string } };
  };
}

export interface SubscribeSuccessAction {
  type: typeof SUBSCRIBE_SUCCESS;
  payload: {
    notificationInfo: { data: { type: string; data: Subscriber; email: string } };
  };
}

export interface UnsubscribeAction {
  type: typeof UNSUBSCRIBE;
  payload: {
    subscriptionInfo: { data: { type: string; data: Subscriber } };
  };
}
export interface DeleteSubscriptionAction {
  type: typeof DELETE_SUBSCRIPTION;
  payload: {
    subscriptionInfo: { data: { type: string; data: Subscriber } };
  };
}
export interface DeleteSubscriptionSuccessAction {
  type: typeof DELETE_SUBSCRIPTION_SUCCESS;
  payload: { subscriber: Subscriber; type: string };
}

export interface UnsubscribeSuccessAction {
  type: typeof UNSUBSCRIBE_SUCCESS;
  payload: { subscriber: Subscriber; type: string };
}

export interface GetAllTypeSubscriptionsAction {
  type: typeof GET_ALL_TYPE_SUBSCRIPTIONS;
  payload: SubscriptionSearchCriteria;
}

export interface GetTypeSubscriptionsActions {
  type: typeof GET_TYPE_SUBSCRIPTIONS;
  payload: { type: string; criteria: SubscriptionSearchCriteria; after: string };
}

export interface GetTypeSubscriptionsSuccessAction {
  type: typeof GET_TYPE_SUBSCRIPTIONS_SUCCESS;
  payload: {
    typeId: string;
    subscriptions: SubscriptionWrapper[];
    after: string;
    next: string;
  };
}

export interface GetSubscriberSubscriptionsAction {
  type: typeof GET_SUBSCRIBER_SUBSCRIPTIONS;
  payload: {
    subscriber: Subscriber;
    after: string;
  };
}
export interface ResolveSubscriberUserAction {
  type: typeof RESOLVE_SUBSCRIBER_USER;
  payload: {
    subscriberId: string;
    userId: string;
  };
}

export interface ResolveSubscriberUserSuccessAction {
  type: typeof RESOLVE_SUBSCRIBER_USER_SUCCESS;
  payload: {
    subscriberId: string;
    accountLink: string;
  };
}

export interface FindSubscribersAction {
  type: typeof FIND_SUBSCRIBERS;
  payload: SubscriberSearchCriteria;
}

export interface FindSubscribersSuccessAction {
  type: typeof FIND_SUBSCRIBERS_SUCCESS;
  payload: {
    subscribers: Subscriber[];
    after: string;
    next: string;
  };
}

export interface DeleteSubscriberAction {
  type: typeof DELETE_SUBSCRIBER;
  payload: {
    subscriberId: string;
  };
}

export interface DeleteSubscriberSuccessAction {
  type: typeof DELETE_SUBSCRIBER_SUCCESS;
  payload: {
    subscriberId: string;
  };
}

export interface UpdateSubscriberAction {
  type: typeof UPDATE_SUBSCRIBER;
  payload: {
    subscriber: Subscriber;
  };
}

export interface UpdateSubscriberSuccessAction {
  type: typeof UPDATE_SUBSCRIBER_SUCCESS;
  payload: {
    subscriberInfo: Subscriber;
  };
}

// ==============
// Action Methods
// ==============

export const GetMySubscriber = (): GetMySubscriberAction => ({
  type: GET_MY_SUBSCRIBER,
});

export const GetMySubscriberSuccess = (
  subscriberInfo: Subscriber & { subscriptions: SubscriptionWrapper[] }
): GetMySubscriberSuccessAction => ({
  type: GET_MY_SUBSCRIBER_SUCCESS,
  payload: {
    subscriberInfo,
  },
});

export const Subscribe = (notificationInfo: { data: { type: string } }): SubscribeAction => ({
  type: SUBSCRIBE,
  payload: {
    notificationInfo,
  },
});

export const SubscribeSuccess = (notificationInfo: {
  data: { type: string; data: Subscriber; email: string };
}): SubscribeSuccessAction => ({
  type: SUBSCRIBE_SUCCESS,
  payload: {
    notificationInfo,
  },
});

export const Unsubscribe = (subscriptionInfo: { data: { type: string; data: Subscriber } }): UnsubscribeAction => ({
  type: UNSUBSCRIBE,
  payload: {
    subscriptionInfo,
  },
});

export const DeleteSubscription = (subscriptionInfo: {
  data: { type: string; data: Subscriber };
}): DeleteSubscriptionAction => ({
  type: DELETE_SUBSCRIPTION,
  payload: {
    subscriptionInfo,
  },
});

export const UnsubscribeSuccess = (subscriber: Subscriber, type: string): UnsubscribeSuccessAction => ({
  type: UNSUBSCRIBE_SUCCESS,
  payload: { subscriber, type },
});

export const DeleteSubscriptionSuccess = (subscriber: Subscriber, type: string): DeleteSubscriptionSuccessAction => ({
  type: DELETE_SUBSCRIPTION_SUCCESS,
  payload: { subscriber, type },
});

export const GetAllTypeSubscriptions = (criteria: SubscriptionSearchCriteria): GetAllTypeSubscriptionsAction => ({
  type: GET_ALL_TYPE_SUBSCRIPTIONS,
  payload: criteria,
});

export const GetTypeSubscriptions = (
  type: string,
  criteria: SubscriptionSearchCriteria,
  after: string
): GetTypeSubscriptionsActions => ({
  type: GET_TYPE_SUBSCRIPTIONS,
  payload: { type, criteria, after },
});

export const GetTypeSubscriptionSuccess = (
  typeId: string,
  subscriptions: SubscriptionWrapper[],
  after: string,
  next: string
): GetTypeSubscriptionsSuccessAction => ({
  type: GET_TYPE_SUBSCRIPTIONS_SUCCESS,
  payload: {
    typeId,
    subscriptions,
    after,
    next,
  },
});

export const GetSubscriberSubscriptions = (
  subscriber: Subscriber,
  after: string
): GetSubscriberSubscriptionsAction => ({
  type: GET_SUBSCRIBER_SUBSCRIPTIONS,
  payload: { subscriber, after },
});

export const FindSubscribers = (criteria: SubscriberSearchCriteria): FindSubscribersAction => ({
  type: FIND_SUBSCRIBERS,
  payload: criteria,
});

export const FindSubscribersSuccess = (
  subscribers: Subscriber[],
  next: string,
  after?: string
): FindSubscribersSuccessAction => ({
  type: FIND_SUBSCRIBERS_SUCCESS,
  payload: {
    subscribers,
    after,
    next,
  },
});

export const ResolveSubscriberUser = (subscriberId: string, userId: string): ResolveSubscriberUserAction => ({
  type: RESOLVE_SUBSCRIBER_USER,
  payload: { subscriberId, userId },
});

export const ResolveSubscriberUserSuccess = (
  subscriberId: string,
  accountLink: string
): ResolveSubscriberUserSuccessAction => ({
  type: RESOLVE_SUBSCRIBER_USER_SUCCESS,
  payload: { subscriberId, accountLink },
});

export const UpdateSubscriber = (subscriber: Subscriber): UpdateSubscriberAction => ({
  type: UPDATE_SUBSCRIBER,
  payload: { subscriber: subscriber },
});

export const UpdateSubscriberSuccess = (subscriberInfo: Subscriber): UpdateSubscriberSuccessAction => ({
  type: UPDATE_SUBSCRIBER_SUCCESS,
  payload: {
    subscriberInfo,
  },
});

export const DeleteSubscriber = (subscriberId: string): DeleteSubscriberAction => ({
  type: DELETE_SUBSCRIBER,
  payload: {
    subscriberId,
  },
});

export const DeleteSubscriberSuccess = (subscriberId: string): DeleteSubscriberSuccessAction => ({
  type: DELETE_SUBSCRIBER_SUCCESS,
  payload: {
    subscriberId,
  },
});
