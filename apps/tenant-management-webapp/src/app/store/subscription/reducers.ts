import {
  ActionTypes,
  SUBSCRIBE_SUBSCRIBER_SUCCESS,
  GET_SUBSCRIBER_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
  GET_SUBSCRIPTION_SUCCESS,
  GET_SUBSCRIPTIONS_SUCCESS,
} from './actions';
import { SUBSCRIBER_INIT, SubscriberService } from './models';

export default function (state = SUBSCRIBER_INIT, action: ActionTypes): SubscriberService {
  switch (action.type) {
    case SUBSCRIBE_SUBSCRIBER_SUCCESS:
      return {
        ...state,
        subscriber: action.payload.notificationInfo.data.data,
        successMessage: `You are subscribed! You will receive notifications on ${action.payload.notificationInfo.data.email}`,
      };
    case GET_SUBSCRIPTION_SUCCESS:
      return {
        ...state,
        subscription: action.payload.subscriberInfo,
      };
    case GET_SUBSCRIPTIONS_SUCCESS:
      return {
        ...state,
        subscriptions: action.payload.subscriberInfo,
      };
    case GET_SUBSCRIBER_SUCCESS:
      return {
        ...state,
        subscriber: action.payload.subscriberInfo,
      };
    case UNSUBSCRIBE_SUCCESS:
      return {
        ...state,
        subscription: null,
        successMessage: 'You have unsubscribed from the notification service!',
      };
    default:
      return state;
  }
}
