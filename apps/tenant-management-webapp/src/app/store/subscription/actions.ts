import { Subscription, Subscriber, SubscriptionWrapper } from './models';
export const CREATE_SUBSCRIBER = 'tenant/subscriber-service/create-subscriber';

export const GET_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/get-subscriber-success';
export const GET_SUBSCRIPTION_SUCCESS = 'tenant/subscriber-service/get-subscription-success';
export const GET_SUBSCRIPTIONS_SUCCESS = 'tenant/subscriber-service/get-subscriptions-success';
export const SUBSCRIBE_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/subscribe-subscriber-success';
export const SUBSCRIBE_SUBSCRIBER = 'tenant/subscriber-service/subscribe-subscriber';
export const GET_SUBSCRIBER = 'tenant/subscriber-service/get-subscriber';
export const GET_SUBSCRIPTION = 'tenant/subscriber-service/get-subscription';
export const GET_SUBSCRIPTIONS = 'tenant/subscriber-service/get-subscriptions';
export const UNSUBSCRIBE = 'tenant/subscriber-service/unsubscribe';
export const UNSUBSCRIBE_SUCCESS = 'tenant/subscriber-service/unsubscribe-success';

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
  | UnsubscribeSuccessAction;

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
  payload: {
    subscriptionInfo: Subscription;
  };
}

export interface CreateSubscriberAction {
  type: typeof CREATE_SUBSCRIBER;
  payload: {
    notificationName: string;
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
}

export interface GetSubscriberAction {
  type: typeof GET_SUBSCRIBER;
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

export const getSubscriber = (): GetSubscriberAction => ({
  type: GET_SUBSCRIBER,
});

export const getSubscription = (subscriptionInfo: {
  data: { type: string; data: Subscriber };
}): GetSubscriptionAction => ({
  type: GET_SUBSCRIPTION,
  payload: {
    subscriptionInfo,
  },
});

export const getSubscriptions = (): GetSubscriptionsAction => ({
  type: GET_SUBSCRIPTIONS,
});

export const GetSubscriberSuccess = (subscriberInfo: Subscriber): GetSubscriberSuccessAction => ({
  type: GET_SUBSCRIBER_SUCCESS,
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

export const GetSubscriptionsSuccess = (subscriberInfo: SubscriptionWrapper[]): GetSubscriptionsSuccessAction => ({
  type: GET_SUBSCRIPTIONS_SUCCESS,
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

export const UnsubscribeSuccess = (subscriptionInfo: Subscription): UnsubscribeSuccessAction => ({
  type: UNSUBSCRIBE_SUCCESS,
  payload: {
    subscriptionInfo,
  },
});

export const SubscribeSubscriberSuccess = (notificationInfo: {
  data: { type: string; data: Subscriber; email: string };
}): SubscribeSubscriberSuccessAction => ({
  type: SUBSCRIBE_SUBSCRIBER_SUCCESS,
  payload: {
    notificationInfo,
  },
});
