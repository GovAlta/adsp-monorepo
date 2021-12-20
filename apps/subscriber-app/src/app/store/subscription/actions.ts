import { Subscriber } from './models';

export const GET_MY_SUBSCRIBER_DETAILS_SUCCESS = 'tenant/notification-service/get-mySubscriber-success';
export const GET_MY_SUBSCRIBER_DETAILS = 'tenant/notification-service/get-mySubscriber';

// =============
// Actions Types
// =============

export type ActionTypes = GetMySubscriberActionSuccess;
export interface GetMySubscriberActionSuccess {
  type: typeof GET_MY_SUBSCRIBER_DETAILS_SUCCESS;
  payload: {
    subscriber: Subscriber;
  };
}
export interface GetMySubscriberAction {
  type: typeof GET_MY_SUBSCRIBER_DETAILS;
}

// ==============
// Action Methods
// ==============

export const GetMySubscriberDetailsSuccess = (subscriber: Subscriber): GetMySubscriberActionSuccess => ({
  type: GET_MY_SUBSCRIBER_DETAILS_SUCCESS,
  payload: {
    subscriber,
  },
});
export const getMySubscriberDetails = (): GetMySubscriberAction => ({
  type: GET_MY_SUBSCRIBER_DETAILS,
});
