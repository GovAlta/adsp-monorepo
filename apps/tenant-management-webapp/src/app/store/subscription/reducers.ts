import {
  ActionTypes,
  SUBSCRIBE_SUBSCRIBER_SUCCESS,
  GET_SUBSCRIBER_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
  GET_SUBSCRIPTION_SUCCESS,
  FIND_SUBSCRIBERS_SUCCESS,
  GET_SUBSCRIPTIONS_SUCCESS,
  UPDATE_SUBSCRIBER_SUCCESS,
} from './actions';

import { SUBSCRIBER_INIT, SubscriberService } from './models';

export default function (state = SUBSCRIBER_INIT, action: ActionTypes): SubscriberService {
  switch (action.type) {
    case UPDATE_SUBSCRIBER_SUCCESS: {
      const newState = Object.assign({}, state);
      const subs = newState.subscriptions;
      const subscriberIndex = subs.findIndex((subs) => subs.subscriber.id === action.payload.subscriberInfo.id);

      subs[subscriberIndex].subscriber = action.payload.subscriberInfo;

      return {
        ...state,
        subscriptions: subs,
      };
    }
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
    case UNSUBSCRIBE_SUCCESS: {
      const channels = action.payload?.channels;
      let addresses: string[] = [];
      if (channels) {
        addresses = channels.map((c): string => {
          return c.address;
        });
      }

      return {
        ...state,
        subscription: null,
        successMessage: `You are unsubscribed! You will no longer receive notifications on ${addresses.join('; ')}`,
      };
    }
    case FIND_SUBSCRIBERS_SUCCESS: {
      const { subscribers, top } = action.payload;
      let hasNext = false;
      if (subscribers.length > top) {
        hasNext = true;
      }
      return {
        ...state,
        search: {
          subscribers: {
            ...state.search.subscribers,
            data: subscribers.slice(0, top),
            hasNext,
            top,
          },
        },
      };
    }

    default:
      return state;
  }
}
