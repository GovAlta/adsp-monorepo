import { Subscription, Subscriber } from './models';

export const GET_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/get-subscriber-success';
export const GET_SUBSCRIPTION_TYPES_SUCCESS = 'tenant/subscriber-service/get-subscription-types-success';
export const GET_SUBSCRIPTION_SUCCESS = 'tenant/subscriber-service/get-subscription-success';
export const SUBSCRIBE_SUBSCRIBER_SUCCESS = 'tenant/subscriber-service/subscribe-subscriber-success';
export const GET_SUBSCRIBER = 'tenant/subscriber-service/get-subscriber';
export const GET_SUBSCRIPTION_TYPES = 'tenant/subscriber-service/get-subscription-types';
export const UNSUBSCRIBE = 'tenant/subscriber-service/unsubscribe';
export const UNSUBSCRIBE_SUCCESS = 'tenant/subscriber-service/unsubscribe-success';

// =============
// Actions Types
// =============

export type ActionTypes =
  | SubscribeSubscriberSuccessAction
  | GetSubscriberSuccessAction
  | GetSubscriptionSuccessAction
  | GetSubscriptionTypesSuccessAction
  | UnsubscribeAction
  | UnsubscribeSuccessAction;

export interface GetSubscriberSuccessAction {
  type: typeof GET_SUBSCRIBER_SUCCESS;
  payload: {
    subscriberInfo: Subscriber;
  };
}
export interface GetSubscriptionTypesSuccessAction {
  type: typeof GET_SUBSCRIPTION_TYPES_SUCCESS;
  payload: {
    subscriptionTypes: any;
  };
}
export interface GetSubscriptionTypesAction {
  type: typeof GET_SUBSCRIPTION_TYPES;
}

export interface GetSubscriptionSuccessAction {
  type: typeof GET_SUBSCRIPTION_SUCCESS;
  payload: {
    subscriberInfo: Subscription;
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

export interface GetSubscriberAction {
  type: typeof GET_SUBSCRIBER;
}

// ==============
// Action Methods
// ==============

export const getSubscriber = (): GetSubscriberAction => ({
  type: GET_SUBSCRIBER,
});

export const GetSubscriberSuccess = (subscriberInfo: Subscriber): GetSubscriberSuccessAction => ({
  type: GET_SUBSCRIBER_SUCCESS,
  payload: {
    subscriberInfo,
  },
});

export const GetSubsciptionTypesSuccess = (subscriptionTypes: any): GetSubscriptionTypesSuccessAction => ({
  type: GET_SUBSCRIPTION_TYPES_SUCCESS,
  payload: subscriptionTypes,
});
export const getSubsciptionTypes = (): GetSubscriptionTypesAction => ({
  type: GET_SUBSCRIPTION_TYPES,
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
