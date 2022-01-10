import { Subscription, Subscriber, SubscriptionWrapper, SubscriberSearchCriteria } from './models';
export const CREATE_SUBSCRIBER = 'tenant/subscriber-service/create-subscriber';
export const UPDATE_SUBSCRIBER = 'tenant/subscriber-service/update-subscriber';
export const GET_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/get-subscriber-success';
export const UPDATE_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/update-subscriber-success';
export const GET_SUBSCRIPTION_SUCCESS = 'tenant/subscriber-service/get-subscription-success';
export const GET_SUBSCRIPTIONS_SUCCESS = 'tenant/subscriber-service/get-subscriptions-success';
export const SUBSCRIBE_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/subscribe-subscriber-success';
export const SUBSCRIBE_SUBSCRIBER = 'tenant/subscriber-service/subscribe-subscriber';
export const GET_SUBSCRIBER = 'tenant/subscriber-service/get-subscriber';
export const GET_SUBSCRIPTION = 'tenant/subscriber-service/get-subscription';
export const GET_SUBSCRIPTIONS = 'tenant/subscriber-service/get-subscriptions';
export const UNSUBSCRIBE = 'tenant/subscriber-service/unsubscribe';
export const UNSUBSCRIBE_SUCCESS = 'tenant/subscriber-service/unsubscribe-success';
export const FIND_SUBSCRIBERS_SUCCESS = 'tenant/subscriber-service/find-subscribers/success';
export const FIND_SUBSCRIBERS = 'tenant/subscriber-service/find-subscribers';
export const GET_TYPE_SUBSCRIPTION = 'tenant/subscriber-service/get-type-subscription';
export const GET_TYPE_SUBSCRIPTION_SUCCESS = 'tenant/subscriber-service/get-type-subscription-success';

// =============
// Actions Types
// =============

export type ActionTypes =
  | CreateSubscriberAction
  | SubscribeSubscriberSuccessAction
  | CreateSubscriberAction
  | GetSubscriberSuccessAction
  | GetSubscriptionSuccessAction
  | GetSubscriptionsSuccessAction
  | UnsubscribeAction
  | UnsubscribeSuccessAction
  | FindSubscribersAction
  | FindSubscribersSuccessAction
  | UpdateSubscriptionsSuccessAction
  | GetTypeSubscriptionSuccessAction;

export interface SubscribeSubscriberServiceAction {
  type: typeof SUBSCRIBE_SUBSCRIBER;
  payload: {
    notificationInfo: { data: { type: string } };
  };
}

export interface GetSubscriberSuccessAction {
  type: typeof GET_SUBSCRIBER_SUCCESS;
  payload: {
    subscriberInfo: Subscriber;
  };
}

export interface GetSubscriptionSuccessAction {
  type: typeof GET_SUBSCRIPTION_SUCCESS;
  payload: {
    subscriberInfo: Subscription;
  };
}

export interface GetSubscriptionsSuccessAction {
  type: typeof GET_SUBSCRIPTIONS_SUCCESS;
  payload: {
    subscriberInfo: SubscriptionWrapper[];
    top: number;
  };
}

export interface SubscribeSubscriberSuccessAction {
  type: typeof SUBSCRIBE_SUBSCRIBER_SUCCESS;
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

export interface UnsubscribeSuccessAction {
  type: typeof UNSUBSCRIBE_SUCCESS;
  payload: Subscriber;
}

export interface CreateSubscriberAction {
  type: typeof CREATE_SUBSCRIBER;
  payload: {
    notificationName: string;
  };
}

export interface UpdateSubscriberAction {
  type: typeof UPDATE_SUBSCRIBER;
  payload: {
    subscriber: Subscriber;
  };
}

export interface GetSubscriptionAction {
  type: typeof GET_SUBSCRIPTION;
  payload: {
    subscriptionInfo: { data: { type: string; data: Subscriber } };
  };
}

export interface GetSubscriptionsAction {
  type: typeof GET_SUBSCRIPTIONS;
  payload: SubscriberSearchCriteria;
}

export interface GetSubscriberAction {
  type: typeof GET_SUBSCRIBER;
}

export interface FindSubscribersAction {
  type: typeof FIND_SUBSCRIBERS;
  payload: SubscriberSearchCriteria;
}

export interface GetTypeSubscriptionActions {
  type: typeof GET_TYPE_SUBSCRIPTION;
  payload: { type: string; criteria: SubscriberSearchCriteria };
}

export interface UpdateSubscriptionsSuccessAction {
  type: typeof UPDATE_SUBSCRIBER_SUCCESS;
  payload: {
    subscriberInfo: Subscriber;
  };
}

export interface FindSubscribersSuccessAction {
  type: typeof FIND_SUBSCRIBERS_SUCCESS;
  payload: {
    subscribers: Subscriber[];
    top: number;
  };
}

export interface GetTypeSubscriptionSuccessAction {
  type: typeof GET_TYPE_SUBSCRIPTION_SUCCESS;
  payload: {
    subscriberInfo: SubscriptionWrapper[];
    top: number;
    type: string;
  };
}

// ==============
// Action Methods
// ==============

export const SubscribeSubscriberService = (notificationInfo: {
  data: { type: string };
}): SubscribeSubscriberServiceAction => ({
  type: SUBSCRIBE_SUBSCRIBER,
  payload: {
    notificationInfo,
  },
});

export const CreateSubscriberService = (notificationName: string): CreateSubscriberAction => ({
  type: CREATE_SUBSCRIBER,
  payload: {
    notificationName,
  },
});

export const UpdateSubscriberService = (subscriber: Subscriber): UpdateSubscriberAction => ({
  type: UPDATE_SUBSCRIBER,
  payload: { subscriber: subscriber },
});

export const getSubscriber = (): GetSubscriberAction => ({
  type: GET_SUBSCRIBER,
});

export const getTypeSubscriptions = (type: string, criteria: SubscriberSearchCriteria): GetTypeSubscriptionActions => ({
  type: GET_TYPE_SUBSCRIPTION,
  payload: { type, criteria },
});

export const getSubscription = (subscriptionInfo: {
  data: { type: string; data: Subscriber };
}): GetSubscriptionAction => ({
  type: GET_SUBSCRIPTION,
  payload: {
    subscriptionInfo,
  },
});

export const getSubscriptions = (criteria: SubscriberSearchCriteria): GetSubscriptionsAction => ({
  type: GET_SUBSCRIPTIONS,
  payload: criteria,
});

export const GetSubscriberSuccess = (subscriberInfo: Subscriber): GetSubscriberSuccessAction => ({
  type: GET_SUBSCRIBER_SUCCESS,
  payload: {
    subscriberInfo,
  },
});

export const UpdateSubscriberSuccess = (subscriberInfo: Subscriber): UpdateSubscriptionsSuccessAction => ({
  type: UPDATE_SUBSCRIBER_SUCCESS,
  payload: {
    subscriberInfo,
  },
});

export const GetSubscriptionSuccess = (subscriberInfo: Subscription): GetSubscriptionSuccessAction => ({
  type: GET_SUBSCRIPTION_SUCCESS,
  payload: {
    subscriberInfo,
  },
});

export const GetSubscriptionsSuccess = (
  subscriberInfo: SubscriptionWrapper[],
  top: number
): GetSubscriptionsSuccessAction => ({
  type: GET_SUBSCRIPTIONS_SUCCESS,
  payload: {
    subscriberInfo,
    top,
  },
});

export const UpdateSubscriptionsSuccess = (subscriberInfo: Subscriber): UpdateSubscriptionsSuccessAction => ({
  type: UPDATE_SUBSCRIBER_SUCCESS,
  payload: {
    subscriberInfo,
  },
});

export const Unsubscribe = (subscriptionInfo: { data: { type: string; data: Subscriber } }): UnsubscribeAction => ({
  type: UNSUBSCRIBE,
  payload: {
    subscriptionInfo,
  },
});

export const UnsubscribeSuccess = (subscriber: Subscriber): UnsubscribeSuccessAction => ({
  type: UNSUBSCRIBE_SUCCESS,
  payload: subscriber,
});

export const SubscribeSubscriberSuccess = (notificationInfo: {
  data: { type: string; data: Subscriber; email: string };
}): SubscribeSubscriberSuccessAction => ({
  type: SUBSCRIBE_SUBSCRIBER_SUCCESS,
  payload: {
    notificationInfo,
  },
});

export const FindSubscribers = (criteria: SubscriberSearchCriteria): FindSubscribersAction => ({
  type: FIND_SUBSCRIBERS,
  payload: criteria,
});

export const FindSubscribersSuccess = (subscribers: Subscriber[], top: number): FindSubscribersSuccessAction => ({
  type: FIND_SUBSCRIBERS_SUCCESS,
  payload: {
    subscribers,
    top,
  },
});

export const GetTypeSubscriptionSuccess = (
  subscriberInfo: SubscriptionWrapper[],
  top: number,
  type: string
): GetTypeSubscriptionSuccessAction => ({
  type: GET_TYPE_SUBSCRIPTION_SUCCESS,
  payload: {
    subscriberInfo,
    top,
    type,
  },
});
