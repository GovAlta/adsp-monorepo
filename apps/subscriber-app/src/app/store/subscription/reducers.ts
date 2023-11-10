import {
  ActionTypes,
  GET_SUBSCRIBER_DETAILS_SUCCESS,
  NO_SUBSCRIBER,
  PATCH_SUBSCRIBER_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
  CREATE_SUBSCRIBER_SUCCESS,
  CHECK_CODE_SUCCESS,
  CHECK_CODE_FAILURE,
  VERIFY_EMAIL_SUCCESS,
  VERIFY_PHONE_SUCCESS,
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
    case VERIFY_EMAIL_SUCCESS: {
      const channelIndex = state.subscriber.channels.findIndex((channel) => channel.channel === 'email');
      state.subscriber.channels[channelIndex].pendingVerification = true;
      state.subscriber.channels[channelIndex].timeCodeSent = Date.now();
      return {
        ...state,
        subscriber: state.subscriber,
      };
    }
    case VERIFY_PHONE_SUCCESS: {
      const channelIndex = state.subscriber.channels.findIndex((channel) => channel.channel === 'sms');
      state.subscriber.channels[channelIndex].pendingVerification = true;
      state.subscriber.channels[channelIndex].timeCodeSent = Date.now();
      return {
        ...state,
        subscriber: state.subscriber,
      };
    }
    case CHECK_CODE_SUCCESS: {
      const channelIndex = action.payload?.response?.channelIndex;
      state.subscriber.channels[channelIndex] = {
        ...state.subscriber.channels[channelIndex],
        verified: true,
        pendingVerification: false,
      };

      return {
        ...state,
        subscriber: state.subscriber,
        previouslyVerified: { [state.subscriber.channels[channelIndex].channel]: true, ...state.previouslyVerified },
      };
    }
    case CHECK_CODE_FAILURE: {
      const channelIndex = action.payload?.response?.channelIndex;
      return {
        ...state,

        previouslyVerified: { [state.subscriber.channels[channelIndex].channel]: true, ...state.previouslyVerified },
      };
    }
    default:
      return state;
  }
}
