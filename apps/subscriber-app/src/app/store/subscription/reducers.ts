import {
  ActionTypes,
  GET_SUBSCRIBER_DETAILS_SUCCESS,
  NO_SUBSCRIBER,
  PATCH_SUBSCRIBER_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
  CREATE_SUBSCRIBER_SUCCESS,
  CHECK_CODE_SUCCESS,
  CHECK_CODE_FAILURE,
} from './actions';
import { SUBSCRIBER_INIT, SubscriberService } from './models';

export default function (state = SUBSCRIBER_INIT, action: ActionTypes): SubscriberService {
  const prevStateSubscriptions = state.subscriber?.subscriptions;
  const prevSubscriptions = state.subscriptions;

  switch (action.type) {
    case NO_SUBSCRIBER:
      return {
        ...state,
        hasSubscriberId: false,
      };
    case GET_SUBSCRIBER_DETAILS_SUCCESS: {
      return {
        ...state,
        subscriber: action.payload.subscriber,
      };
    }
    case UNSUBSCRIBE_SUCCESS:
      return {
        ...state,
        subscriptions: prevSubscriptions.filter((item) => item.typeId !== action.payload.typeId),
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

    case CREATE_SUBSCRIBER_SUCCESS: {
      return {
        ...state,

        subscriber: action.payload.subscriber,
      };
    }
    case CHECK_CODE_SUCCESS: {
      const checkedChannel = action.payload.response.channel as string;

      const channelIndex = state.subscriber.channels.findIndex((channel) => channel.channel === checkedChannel);

      state.subscriber.channels[0].verified = true;

      return {
        ...state,
        subscriber: state.subscriber,
        previouslyVerified: true,
      };
    }
    case CHECK_CODE_FAILURE: {
      return {
        ...state,

        previouslyVerified: true,
      };
    }
    default:
      return state;
  }
}
