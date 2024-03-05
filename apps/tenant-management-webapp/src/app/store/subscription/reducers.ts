import {
  ActionTypes,
  FIND_SUBSCRIBERS_SUCCESS,
  UPDATE_SUBSCRIBER_SUCCESS,
  GET_TYPE_SUBSCRIPTIONS_SUCCESS,
  RESOLVE_SUBSCRIBER_USER_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
  GET_MY_SUBSCRIBER_SUCCESS,
  SUBSCRIBE_SUCCESS,
  DELETE_SUBSCRIBER_SUCCESS,
  DELETE_SUBSCRIPTION_SUCCESS,
} from './actions';

import { SUBSCRIBER_INIT, SubscriberService, SubscriptionWrapper } from './models';

export default function (state = SUBSCRIBER_INIT, action: ActionTypes): SubscriberService {
  switch (action.type) {
    case GET_MY_SUBSCRIBER_SUCCESS: {
      const { subscriptions, ...subscriber } = action.payload.subscriberInfo;
      return {
        ...state,
        subscribers: {
          ...state.subscribers,
          [action.payload.subscriberInfo.id]: subscriber,
        },
        subscriptions: subscriptions.reduce(
          (subs, sub) => ({ ...subs, [`${sub.typeId}:${subscriber.id}`]: sub }),
          state.subscriptions
        ),
      };
    }
    case SUBSCRIBE_SUCCESS: {
      const {
        data: { type, data: subscriber },
      } = action.payload.notificationInfo;
      return {
        ...state,
        subscriptions: {
          ...state.subscriptions,
          [`${type}:${subscriber.id}`]: {},
        },
        subscribers: {
          ...state.subscribers,
          [subscriber.id]: { ...state.subscribers[subscriber.id], ...subscriber },
        },
      };
    }
    case UNSUBSCRIBE_SUCCESS:
    case DELETE_SUBSCRIPTION_SUCCESS: {
      const { subscriber, type } = action.payload;
      const newState = {
        ...state,
        subscriptions: {
          ...state.subscriptions,
          [`${type}:${subscriber.id}`]: undefined,
        },
      };
      // Delete the subscription record.
      delete newState.subscriptions[`${type}:${subscriber.id}`];

      // Delete the result under the type.
      const typeSubscriptions = newState.typeSubscriptionSearch[type];
      const typeIndex = typeSubscriptions?.results.findIndex((result) => result === subscriber.id);
      if (typeIndex > -1) {
        typeSubscriptions.results.splice(typeIndex, 1);
      }

      return {
        ...state,
        subscriptions: {
          ...state.subscriptions,
          [`${type}:${subscriber.id}`]: undefined,
        },
        typeSubscriptionSearch: typeSubscriptions
          ? {
              ...state.typeSubscriptionSearch,
              [type]: {
                ...typeSubscriptions,
              },
            }
          : state.typeSubscriptionSearch,
      };
    }
    case GET_TYPE_SUBSCRIPTIONS_SUCCESS: {
      const { typeId, subscriptions = [], after, next } = action.payload;

      return {
        ...state,
        subscriptions: subscriptions.reduce(
          (subs, { subscriber, ...sub }): Record<string, SubscriptionWrapper> => ({ // eslint-disable-line @typescript-eslint/no-unused-vars
            ...subs,
            [`${sub.typeId}:${sub.subscriberId}`]: sub,
          }),
          state.subscriptions
        ),
        subscribers: subscriptions
          .map(({ subscriber }) => subscriber)
          .reduce((subs, sub) => ({ ...subs, [sub.id]: { ...subs[sub.id], ...sub } }), state.subscribers),
        typeSubscriptionSearch: {
          ...state.typeSubscriptionSearch,
          [typeId]: {
            results: after
              ? [...state.typeSubscriptionSearch[typeId].results, ...subscriptions.map((sub) => sub.subscriberId)]
              : subscriptions.map((sub) => sub.subscriberId),
            next,
          },
        },
      };
    }
    case FIND_SUBSCRIBERS_SUCCESS: {
      const { subscribers, after, next } = action.payload;
      let newSubscriber = {};
      let results = null;

      if (subscribers) {
        newSubscriber = subscribers.reduce(
          (subs, sub) => ({ ...subs, [sub.id]: { ...subs[sub.id], ...sub } }),
          state.subscribers
        );
        results = [
          ...(after && state.subscriberSearch.results ? state.subscriberSearch.results : []),
          ...subscribers.map((subscriber) => subscriber.id),
        ];
      }

      return {
        ...state,
        subscribers: newSubscriber,
        subscriberSearch: {
          ...state.subscriberSearch,
          results: results,
          next,
        },
        typeSubscriptionSearch: {},
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
    case UPDATE_SUBSCRIBER_SUCCESS: {
      return {
        ...state,
        subscribers: {
          ...state.subscribers,
          [action.payload.subscriberInfo.id]: {
            ...state.subscribers[action.payload.subscriberInfo.id],
            ...action.payload.subscriberInfo,
          },
        },
      };
    }
    case DELETE_SUBSCRIBER_SUCCESS: {
      delete state.subscribers[action.payload.subscriberId];
      Object.keys(state.subscriptions)
        .filter((key) => key.endsWith(action.payload.subscriberId))
        .forEach((key) => {
          delete state.subscriptions[key];
        });
      return {
        ...state,
        subscribers: { ...state.subscribers },
        subscriptions: { ...state.subscriptions },
      };
    }
    default:
      return state;
  }
}
