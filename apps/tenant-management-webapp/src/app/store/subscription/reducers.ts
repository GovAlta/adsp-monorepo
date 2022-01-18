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
  GET_SUBSCRIBER_SUBSCRIPTIONS_SUCCESS,
  TRIGGER_VISIBILITY_SUBSCRIBER,
  RESET_VISIBILITY_IN_SUBSCRIBERS,
} from './actions';

import { SUBSCRIBER_INIT, SubscriberService, SubscriberAndSubscriptions } from './models';

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
        successMessage: `You are subscribed! You will receive notifications on ${action.payload.notificationInfo.data.email} for ${action.payload.notificationInfo.data.type}`,
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
      const newSubs = subscriptions?.filter((subscription) => subscription.subscriber.id !== action.payload.id);
      const type = state.subscription.typeId;

      return {
        ...state,
        subscription: null,
        subscriptions: newSubs,
        successMessage: `You are unsubscribed! You will no longer receive notifications on ${addresses.join(
          '; '
        )} for ${type}`,
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
    case GET_SUBSCRIBER_SUBSCRIPTIONS_SUCCESS: {
      const { subscriptions, subscriber } = action.payload;

      const key = subscriber.id;

      const SubscriberAndSubscriptions: SubscriberAndSubscriptions = {
        subscriptions: subscriptions,
        subscriber: subscriber,
      };

      SubscriberAndSubscriptions.subscriber.visibleSubscriptions = true;

      return {
        ...state,
        subscriberSubscriptions: {
          ...state.subscriberSubscriptions,
          [key]: SubscriberAndSubscriptions,
        },
      };
    }

    case TRIGGER_VISIBILITY_SUBSCRIBER: {
      const { subscriber } = action.payload;

      const subscriberSubscriptions = state.subscriberSubscriptions;

      const visible = subscriberSubscriptions[subscriber.id].subscriber.visibleSubscriptions;

      subscriberSubscriptions[subscriber.id].subscriber.visibleSubscriptions = !visible;
      const key = subscriber.id;
      return {
        ...state,
        subscriberSubscriptions: {
          ...state.subscriberSubscriptions,
          [key]: subscriberSubscriptions[subscriber.id],
        },
      };
    }

    case RESET_VISIBILITY_IN_SUBSCRIBERS: {
      const newState = Object.assign({}, state);

      const subscriberSubscriptions = newState.subscriberSubscriptions;

      const keys = Object.keys(subscriberSubscriptions);

      keys.forEach((subs) => {
        subscriberSubscriptions[subs].subscriber.visibleSubscriptions = false;
      });

      return {
        ...state,
        subscriberSubscriptions: subscriberSubscriptions,
      };
    }

    default:
      return state;
  }
}
