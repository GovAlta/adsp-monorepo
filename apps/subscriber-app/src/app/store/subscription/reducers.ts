import {
  ActionTypes,
  GET_SUBSCRIBER_DETAILS_SUCCESS,
  NO_SUBSCRIBER,
  PATCH_SUBSCRIBER_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
} from './actions';
import { SUBSCRIBER_INIT, SubscriberService } from './models';

export default function (state = SUBSCRIBER_INIT, action: ActionTypes): SubscriberService {
  switch (action.type) {
    case NO_SUBSCRIBER:
      return {
        ...state,
        hasSubscriberId: false,
      };
    case GET_SUBSCRIBER_DETAILS_SUCCESS: {
      const { subscriptions, ...subscriber } = action.payload.subscriber;
      return {
        ...state,
        subscriber: subscriber,
        subscriptions: [...subscriptions],
      };
    }
    case UNSUBSCRIBE_SUCCESS:
      return {
        ...state,
        subscriptions: state.subscriptions.filter((item) => item.typeId !== action.payload.typeId),
      };
    case PATCH_SUBSCRIBER_SUCCESS:
      return {
        ...state,
        subscriber: {
          ...state.subscriber,
          channels: action.payload.subscriber.channels,
        },
      };
    default:
      return state;
  }
}
