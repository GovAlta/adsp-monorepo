import {
  Subscription,
  Subscriber,
  SubscriptionWrapper,
  SubscriberSearchCriteria,
  SubscriptionSearchCriteria,
} from './models';
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
export const GET_SUBSCRIBER_SUBSCRIPTIONS = 'tenant/subscriber-service/get-subscription-subscriber';
export const GET_SUBSCRIBER_SUBSCRIPTIONS_SUCCESS = 'tenant/subscriber-service/get-subscription-subscriber-success';
export const RESOLVE_SUBSCRIBER_USER = 'tenant/subscriber-service/resolve-subscriber-user';
export const RESOLVE_SUBSCRIBER_USER_SUCCESS = 'tenant/subscriber-service/resolve-subscriber-user-success';
export const TRIGGER_VISIBILITY_SUBSCRIBER = 'tenant/subscriber-service/make-visible';
export const RESET_VISIBILITY_IN_SUBSCRIBERS = 'tenant/subscriber-service/reset-visibility';
export const EMAIL_EXISTS = 'tenant/subscriber-service/email-exists';
export const RESET_UPDATE_ERRORS = 'tenant/subscriber-service/reset-update-errors';

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
  | GetTypeSubscriptionSuccessAction
  | GetSubscriberSubscriptionsSuccessAction
  | ResolveSubscriberUserAction
  | ResolveSubscriberUserSuccessAction
  | TriggerVisibilitySubscribersServiceAction
  | ResetVisibilityInSubscribersServiceAction
  | EmailExistsAction
  | ResetUpdateErrorsAction;

export interface SubscribeSubscriberServiceAction {
  type: typeof SUBSCRIBE_SUBSCRIBER;
  payload: {
    notificationInfo: { data: { type: string } };
  };
}

export interface TriggerVisibilitySubscribersServiceAction {
  type: typeof TRIGGER_VISIBILITY_SUBSCRIBER;
  payload: {
    subscriber: Subscriber;
  };
}

export interface ResetVisibilityInSubscribersServiceAction {
  type: typeof RESET_VISIBILITY_IN_SUBSCRIBERS;
}

export interface GetSubscriberSubscriptionsSuccessAction {
  type: typeof GET_SUBSCRIBER_SUBSCRIPTIONS_SUCCESS;
  payload: {
    subscriptions: SubscriptionWrapper[];
    subscriber: Subscriber;
  };
}

export interface GetSubscriberSubscriptionsAction {
  type: typeof GET_SUBSCRIBER_SUBSCRIPTIONS;
  payload: {
    subscriber: Subscriber;
  };
}

export interface ResolveSubscriberUserSuccessAction {
  type: typeof RESOLVE_SUBSCRIBER_USER_SUCCESS;
  payload: {
    subscriberId: string;
    accountLink: string;
  };
}

export interface ResolveSubscriberUserAction {
  type: typeof RESOLVE_SUBSCRIBER_USER;
  payload: {
    subscriberId: string;
    userId: string;
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

export interface ResetUpdateErrorsAction {
  type: typeof RESET_UPDATE_ERRORS;
}

export interface EmailExistsAction {
  type: typeof EMAIL_EXISTS;
  payload: {
    email: string;
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
  payload: { subscriber: Subscriber; type: string };
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
  payload: SubscriptionSearchCriteria;
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
    after: string;
    next: string;
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

export const getSubscriberSubscriptions = (subscriber: Subscriber): GetSubscriberSubscriptionsAction => ({
  type: GET_SUBSCRIBER_SUBSCRIPTIONS,
  payload: { subscriber },
});

export const getSubscription = (subscriptionInfo: {
  data: { type: string; data: Subscriber };
}): GetSubscriptionAction => ({
  type: GET_SUBSCRIPTION,
  payload: {
    subscriptionInfo,
  },
});

export const getSubscriptions = (criteria: SubscriptionSearchCriteria): GetSubscriptionsAction => ({
  type: GET_SUBSCRIPTIONS,
  payload: criteria,
});

export const GetSubscriberSuccess = (subscriberInfo: Subscriber): GetSubscriberSuccessAction => ({
  type: GET_SUBSCRIBER_SUCCESS,
  payload: {
    subscriberInfo,
  },
});

export const GetSubscriberSubscriptionsSuccess = (
  subscriptions: SubscriptionWrapper[],
  subscriber: Subscriber
): GetSubscriberSubscriptionsSuccessAction => ({
  type: GET_SUBSCRIBER_SUBSCRIPTIONS_SUCCESS,
  payload: {
    subscriptions,
    subscriber,
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

export const TriggerVisibilitySubscribersService = (
  subscriber: Subscriber
): TriggerVisibilitySubscribersServiceAction => ({
  type: TRIGGER_VISIBILITY_SUBSCRIBER,
  payload: {
    subscriber,
  },
});

export const ResetVisibilityInSubscribersService = (): ResetVisibilityInSubscribersServiceAction => ({
  type: RESET_VISIBILITY_IN_SUBSCRIBERS,
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

export const EmailExists = (email: string): EmailExistsAction => ({
  type: EMAIL_EXISTS,
  payload: {
    email,
  },
});

export const ResetUpdateErrors = (): ResetUpdateErrorsAction => ({
  type: RESET_UPDATE_ERRORS,
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

export const UnsubscribeSuccess = (subscriber: Subscriber, type: string): UnsubscribeSuccessAction => ({
  type: UNSUBSCRIBE_SUCCESS,
  payload: { subscriber, type },
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
