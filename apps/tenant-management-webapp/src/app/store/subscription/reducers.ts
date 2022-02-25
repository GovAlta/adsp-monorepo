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
  EMAIL_EXISTS,
  RESET_UPDATE_ERRORS,
  RESOLVE_SUBSCRIBER_USER_SUCCESS,
} from './actions';

import { SUBSCRIBER_INIT, SubscriberService, SubscriberAndSubscriptions } from './models';

export default function (state = SUBSCRIBER_INIT, action: ActionTypes): SubscriberService {
  switch (action.type) {
    case UPDATE_SUBSCRIBER_SUCCESS: {
      return {
        ...state,
        subscribers: {
          ...state.subscribers,
          [action.payload.subscriberInfo.id]: action.payload.subscriberInfo,
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
      const { subscriber, type } = action.payload;
      const channels = subscriber.channels;
      let addresses: string[] = [];
      if (channels) {
        addresses = channels.map((c): string => {
          return c.address;
        });
      }

      const newState = Object.assign({}, state);
      const subscriptions = newState.subscriptions;
      const newSubs = subscriptions?.filter((subscription) => subscription.subscriber.id !== subscriber.id);

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
      const { subscribers, after, next } = action.payload;
      return {
        ...state,
        subscribers: subscribers.reduce((subs, sub) => ({ ...subs, [sub.id]: sub }), state.subscribers),
        search: {
          ...state.search,
          results: [...(after ? state.search.results : []), ...subscribers.map((subscriber) => subscriber.id)],
          next,
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

    case RESOLVE_SUBSCRIBER_USER_SUCCESS: {
      return {
        ...state,
        subscribers: {
          ...state.subscribers,
          [action.payload.subscriberId]: {
            ...state.subscribers[action.payload.subscriberId],
            accountLink: action.payload.accountLink,
          },
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

    case EMAIL_EXISTS: {
      return {
        ...state,
        updateError: `Subscriber with email ${action.payload.email} already exists`,
      };
    }

    case RESET_UPDATE_ERRORS: {
      return {
        ...state,
        updateError: '',
      };
    }

    default:
      return state;
  }
}
