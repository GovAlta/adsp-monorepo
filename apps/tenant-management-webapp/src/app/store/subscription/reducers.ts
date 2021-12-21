import {
  ActionTypes,
  SUBSCRIBE_SUBSCRIBER_SUCCESS,
  GET_SUBSCRIBER_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
  GET_SUBSCRIPTION_SUCCESS,
  FIND_SUBSCRIBERS_SUCCESS
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
    case GET_SUBSCRIBER_SUCCESS:
      return {
        ...state,
        subscriber: action.payload.subscriberInfo,
      };
    case UNSUBSCRIBE_SUCCESS: {
      const channels = action.payload?.channels;
      let addresses: string[] = []
      if (channels) {
        addresses = channels.map((c): string => { return c.address })
      }

      return {
        ...state,
        subscription: null,
        successMessage: `You are unsubscribed! You will no longer receive notifications on ${addresses.join('; ')}`,
      };
    }
    case FIND_SUBSCRIBERS_SUCCESS: {
      // Not necessary to return a new object.
      state.search.subscribers = { ...action.payload.subscribers }
      return state
    }

    default:
      return state;
  }
}
