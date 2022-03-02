import { Subscriber, SubscriberChannel } from './models';

export const GET_MY_SUBSCRIBER_DETAILS_SUCCESS = 'tenant/notification-service/get-mySubscriber-success';
export const GET_MY_SUBSCRIBER_DETAILS = 'tenant/notification-service/get-mySubscriber';

export const GET_SUBSCRIBER_DETAILS_SUCCESS = 'tenant/notification-service/get-mySubscriber-success';
export const GET_SUBSCRIBER_DETAILS = 'tenant/notification-service/get-mySubscriber';

export const UNSUBSCRIBE_SUCCESS = 'tenant/notification-service/unsubscribe-success';
export const UNSUBSCRIBE_FAILED = 'tenant/notification-service/unsubscribe-failed';
export const UNSUBSCRIBE = 'tenant/notification-service/unsubscribe';

export const PATCH_SUBSCRIBER = 'tenant/notification-service/patch-subscriber';
export const PATCH_SUBSCRIBER_SUCCESS = 'tenant/notification-service/patch-subscriber-success';

// =============
// Actions Types
// =============

export type ActionTypes =
  | PatchSubscriberActionSuccess
  | GetMySubscriberActionSuccess
  | UnsubscribeActionSuccess
  | GetSubscriberActionSuccess;
export interface GetMySubscriberActionSuccess {
  type: typeof GET_MY_SUBSCRIBER_DETAILS_SUCCESS;
  payload: {
    subscriber: Subscriber;
  };
}
export interface GetSubscriberActionSuccess {
  type: typeof GET_MY_SUBSCRIBER_DETAILS_SUCCESS;
  payload: {
    subscriber: Subscriber;
  };
}
export interface UnsubscribeActionSuccess {
  type: typeof UNSUBSCRIBE_SUCCESS;
  payload: {
    typeId: string;
  };
}
export interface GetMySubscriberAction {
  type: typeof GET_MY_SUBSCRIBER_DETAILS;
}
export interface GetSubscriberAction {
  type: typeof GET_SUBSCRIBER_DETAILS;
  payload: { subscriberId: string };
}
export interface UnsubscribeAction {
  type: typeof UNSUBSCRIBE;
  payload: { type: string; subscriberId: string };
}

export interface PatchSubscriberAction {
  type: typeof PATCH_SUBSCRIBER;
  payload: { channels: SubscriberChannel[]; subscriberId: string };
}
export interface PatchSubscriberActionSuccess {
  type: typeof PATCH_SUBSCRIBER_SUCCESS;
  payload: {
    subscriber: Subscriber;
  };
}

// ==============
// Action Methods
// ==============

export const unsubscribe = (subscriptionInfo: { type: string; subscriberId: string }): UnsubscribeAction => ({
  type: UNSUBSCRIBE,
  payload: {
    ...subscriptionInfo,
  },
});

export const UnsubscribeSuccess = (typeId: string): UnsubscribeActionSuccess => ({
  type: UNSUBSCRIBE_SUCCESS,
  payload: {
    typeId,
  },
});

export const PatchSubscriberSuccess = (subscriber: Subscriber): PatchSubscriberActionSuccess => ({
  type: PATCH_SUBSCRIBER_SUCCESS,
  payload: {
    subscriber,
  },
});

export const patchSubscriber = (channels: SubscriberChannel[], subscriberId: string): PatchSubscriberAction => ({
  type: PATCH_SUBSCRIBER,
  payload: {
    channels,
    subscriberId,
  },
});

export const GetSubscriberDetailsSuccess = (subscriber: Subscriber): GetSubscriberActionSuccess => ({
  type: GET_SUBSCRIBER_DETAILS_SUCCESS,
  payload: {
    subscriber,
  },
});

export const GetMySubscriberDetailsSuccess = (subscriber: Subscriber): GetMySubscriberActionSuccess => ({
  type: GET_MY_SUBSCRIBER_DETAILS_SUCCESS,
  payload: {
    subscriber,
  },
});
export const getMySubscriberDetails = (): GetMySubscriberAction => ({
  type: GET_MY_SUBSCRIBER_DETAILS,
});

export const getSubscriberDetails = (subscriberId: string): GetSubscriberAction => ({
  type: GET_SUBSCRIBER_DETAILS,
  payload: {
    subscriberId,
  },
});
