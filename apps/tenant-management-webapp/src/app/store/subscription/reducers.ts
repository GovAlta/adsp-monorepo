import {
  ActionTypes,
  SUBSCRIBE_SUBSCRIBER_SUCCESS,
  GET_SUBSCRIBER_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
  GET_SUBSCRIPTION_SUCCESS,
  FIND_SUBSCRIBERS_SUCCESS,
  GET_SUBSCRIPTIONS_SUCCESS,
  UPDATE_SUBSCRIBER_SUCCESS,
  GET_TYPE_SUBSCRIPTION_SUCCESS,
} from './actions';

import { SUBSCRIBER_INIT, SubscriberService } from './models';

export default function (state = SUBSCRIBER_INIT, action: ActionTypes): SubscriberService {
  switch (action.type) {
    case UPDATE_SUBSCRIBER_SUCCESS: {
      const existingSubscribers = state.search.subscribers;
      const subscriberIndex = existingSubscribers.data.findIndex(
        (subs) => subs.id === action.payload.subscriberInfo.id
      );

      existingSubscribers.data[subscriberIndex] = action.payload.subscriberInfo;

      return {
        ...state,
        search: {
          subscribers: {
            data: existingSubscribers.data,
            hasNext: existingSubscribers.hasNext,
            top: existingSubscribers.top,
            pageSize: existingSubscribers.pageSize,
          },
        },
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
    case GET_SUBSCRIPTIONS_SUCCESS: {
      const { subscriberInfo } = action.payload;

      return {
        ...state,
        subscriptions: subscriberInfo,
        subscriptionsHasNext: [],
      };
    }
    case GET_TYPE_SUBSCRIPTION_SUCCESS: {
      const { subscriberInfo, top, type } = action.payload;

      const hasNext = state.subscriptionsHasNext;

      let typeIndex = hasNext.findIndex((item) => item.id === type);
      if (typeIndex === -1) {
        typeIndex = 0;
        const ix = { id: type, hasNext: false, top: top };
        if (subscriberInfo.length >= 10) {
          ix.hasNext = true;
        }

        hasNext.push(ix);
      } else {
        hasNext[typeIndex].id = type;
        hasNext[typeIndex].hasNext = false;
        hasNext[typeIndex].top = top;

        if (subscriberInfo.length >= 10) {
          hasNext[typeIndex].hasNext = true;
        }
      }

      return {
        ...state,
        subscriptionsHasNext: hasNext,
        subscriptions: state.subscriptions.concat(subscriberInfo),
      };
    }

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

      const newState = Object.assign({}, state);
      const subscriptions = newState.subscriptions;
      const newSubs = subscriptions.filter((subscription) => subscription.subscriber.id !== action.payload.id);

      return {
        ...state,
        subscription: null,
        subscriptions: newSubs,
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
