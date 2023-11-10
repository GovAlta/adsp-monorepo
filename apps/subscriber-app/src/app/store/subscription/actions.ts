import { Subscriber, Subscription, SubscriberChannel } from './models';

export const GET_MY_SUBSCRIBER_DETAILS_SUCCESS = 'tenant/notification-service/get-mySubscriber-success';
export const GET_SUBSCRIBER_DETAILS_SUCCESS = 'tenant/notification-service/get-Subscriber-success';
export const GET_MY_SUBSCRIBER_DETAILS = 'tenant/notification-service/get-mySubscriber';
export const GET_SUBSCRIBER_DETAILS = 'tenant/notification-service/get-Subscriber';

export const UNSUBSCRIBE_SUCCESS = 'tenant/notification-service/unsubscribe-success';
export const UNSUBSCRIBE_FAILED = 'tenant/notification-service/unsubscribe-failed';
export const UNSUBSCRIBE = 'tenant/notification-service/unsubscribe';
export const SIGNED_OUT_UNSUBSCRIBE = 'tenant/notification-service/signed-out-unsubscribe';

export const PATCH_SUBSCRIBER = 'tenant/notification-service/patch-subscriber';
export const PATCH_SUBSCRIBER_SUCCESS = 'tenant/notification-service/patch-subscriber-success';

export const NO_SUBSCRIBER = 'tenant/notification-service/no-subscriber';

export const CREATE_SUBSCRIBER = 'tenant/notification-service/create-subscriber';
export const CREATE_SUBSCRIBER_SUCCESS = 'tenant/notification-service/create-subscriber-success';
export const VERIFY_EMAIL = 'tenant/notification-service/verify-email';
export const VERIFY_EMAIL_SUCCESS = 'tenant/notification-service/verify-email-success';
export const VERIFY_PHONE = 'tenant/notification-service/verify-phone';
export const VERIFY_PHONE_SUCCESS = 'tenant/notification-service/verify-phone-success';
export const CHECK_CODE = 'tenant/notification-service/check-code';
export const CHECK_CODE_SUCCESS = 'tenant/notification-service/check-code-success';
export const CHECK_CODE_FAILURE = 'tenant/notification-service/check-code-failure';

// =============
// Actions Types
// =============

export type ActionTypes =
  | NoSubscriber
  | PatchSubscriberActionSuccess
  | GetMySubscriberActionSuccess
  | UnsubscribeActionSuccess
  | GetSubscriberActionSuccess
  | CreateSubscriptionActionSuccess
  | VerifyEmailActionSuccess
  | VerifyPhoneActionSuccess
  | CheckCodeActionSuccess
  | CheckCodeActionFailure;
export interface GetMySubscriberActionSuccess {
  type: typeof GET_MY_SUBSCRIBER_DETAILS_SUCCESS;
  payload: {
    subscriber: Subscriber;
  };
}
export interface GetSubscriberActionSuccess {
  type: typeof GET_SUBSCRIBER_DETAILS_SUCCESS;
  payload: {
    subscriber: Subscriber & { subscriptions: Subscription[] };
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

export interface GetSignedOutSubscriberAction {
  type: typeof SIGNED_OUT_UNSUBSCRIBE;
  payload: { type: string; subscriberId: string; tenantId: string };
}

export interface PatchSubscriberAction {
  type: typeof PATCH_SUBSCRIBER;
  payload: { channels: SubscriberChannel[]; subscriberId: string; action?: string };
}
export interface PatchSubscriberActionSuccess {
  type: typeof PATCH_SUBSCRIBER_SUCCESS;
  payload: {
    subscriber: Subscriber;
  };
}
export interface NoSubscriber {
  type: typeof NO_SUBSCRIBER;
}

export interface CreateSubscribeAction {
  type: typeof CREATE_SUBSCRIBER;
}

export interface CreateSubscriptionActionSuccess {
  type: typeof CREATE_SUBSCRIBER_SUCCESS;
  payload: {
    subscriber: Subscriber;
  };
}
export interface VerifyEmailAction {
  type: typeof VERIFY_EMAIL;
  subscriber: Subscriber;
  nonLoggedIn?: boolean;
}

export interface VerifyEmailActionSuccess {
  type: typeof VERIFY_EMAIL_SUCCESS;
  payload: {
    response: any;
  };
}
export interface VerifyPhoneAction {
  type: typeof VERIFY_PHONE;
  subscriber: Subscriber;
  nonLoggedIn?: boolean;
}

export interface VerifyPhoneActionSuccess {
  type: typeof VERIFY_PHONE_SUCCESS;
  payload: {
    response: any;
  };
}
export interface CheckCodeAction {
  type: typeof CHECK_CODE;
  channel: string;
  code: string;
  subscriber: Subscriber;
  nonLoggedIn?: boolean;
}

export interface CheckCodeActionSuccess {
  type: typeof CHECK_CODE_SUCCESS;
  payload: {
    response: { channelIndex: number };
  };
}

export interface CheckCodeActionFailure {
  type: typeof CHECK_CODE_FAILURE;
  payload: {
    response: { channelIndex: number };
  };
}

// ==============
// Action Methods
// ==============

export const NoSubscriberAction = (): NoSubscriber => ({
  type: NO_SUBSCRIBER,
});

export const unsubscribe = (subscriptionInfo: { type: string; subscriberId: string }): UnsubscribeAction => ({
  type: UNSUBSCRIBE,
  payload: {
    ...subscriptionInfo,
  },
});

export const signedOutUnsubscribe = (subscriptionInfo: {
  type: string;
  subscriberId: string;
  tenantId: string;
}): GetSignedOutSubscriberAction => ({
  type: SIGNED_OUT_UNSUBSCRIBE,
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

export const patchSubscriber = (
  channels: SubscriberChannel[],
  subscriberId: string,
  action?: string
): PatchSubscriberAction => ({
  type: PATCH_SUBSCRIBER,
  payload: {
    channels,
    subscriberId,
    action,
  },
});

export const GetSubscriberDetailsSuccess = (
  subscriber: Subscriber & { subscriptions: Subscription[] }
): GetSubscriberActionSuccess => ({
  type: GET_SUBSCRIBER_DETAILS_SUCCESS,
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

export const createSubscriber = (): CreateSubscribeAction => ({
  type: CREATE_SUBSCRIBER,
});

export const createSubscriberSuccess = (subscriber): CreateSubscriptionActionSuccess => ({
  type: CREATE_SUBSCRIBER_SUCCESS,
  payload: {
    subscriber,
  },
});
export const VerifyEmail = (subscriber: Subscriber, nonLoggedIn: boolean): VerifyEmailAction => ({
  type: VERIFY_EMAIL,
  subscriber,
  nonLoggedIn,
});

export const VerifyEmailSuccess = (response): VerifyEmailActionSuccess => ({
  type: VERIFY_EMAIL_SUCCESS,
  payload: {
    response,
  },
});
export const VerifyPhone = (subscriber: Subscriber, nonLoggedIn: boolean): VerifyPhoneAction => ({
  type: VERIFY_PHONE,
  subscriber,
  nonLoggedIn,
});

export const VerifyPhoneSuccess = (response): VerifyPhoneActionSuccess => ({
  type: VERIFY_PHONE_SUCCESS,
  payload: {
    response,
  },
});
export const CheckCode = (
  channel: string,
  code: string,
  subscriber: Subscriber,
  nonLoggedIn: boolean
): CheckCodeAction => ({
  type: CHECK_CODE,
  channel,
  code,
  subscriber,
  nonLoggedIn,
});

export const CheckCodeSuccess = (response): CheckCodeActionSuccess => ({
  type: CHECK_CODE_SUCCESS,
  payload: {
    response,
  },
});
export const CheckCodeFailure = (response): CheckCodeActionFailure => ({
  type: CHECK_CODE_FAILURE,
  payload: {
    response,
  },
});
