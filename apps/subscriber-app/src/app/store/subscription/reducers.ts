import {
  ActionTypes,
  GET_MY_SUBSCRIBER_DETAILS_SUCCESS,
  GET_SUBSCRIBER_DETAILS_SUCCESS,
  NO_SUBSCRIBER,
  PATCH_SUBSCRIBER_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
} from './actions';
import { SUBSCRIBER_INIT, SubscriberService } from './models';

export default function (state = SUBSCRIBER_INIT, action: ActionTypes): SubscriberService {
  const prevStateSubscriptions = state.subscriber?.subscriptions;
  switch (action.type) {
    case NO_SUBSCRIBER:
      return {
        ...state,
        hasSubscriberId: false,
      };
    case GET_MY_SUBSCRIBER_DETAILS_SUCCESS:
      return {
        ...state,
        subscriber: action.payload.subscriber,
      };
    case GET_SUBSCRIBER_DETAILS_SUCCESS:
      console.log('we made it here');
      console.log(JSON.stringify(action.payload));
      return {
        ...state,
        subscriptions: action.payload.subscriptions,
      };
    case UNSUBSCRIBE_SUCCESS:
      return {
        ...state,
        subscriber: {
          ...state.subscriber,
          subscriptions: prevStateSubscriptions.filter((item) => item.typeId !== action.payload.typeId),
        },
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
