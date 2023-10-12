import { v4 as uuidv4 } from 'uuid';
import {
  ActionTypes,
  BASIC_NOTIFICATION,
  DISMISS_NOTIFICATION,
  ERROR_NOTIFICATION,
  SUCCESS_NOTIFICATION,
} from './actions';
import { NotificationState, NOTIFICATION_INIT } from './models';

const MessageExpiryTime = 5000;

export default function (state: NotificationState = NOTIFICATION_INIT, action: ActionTypes): NotificationState {
  switch (action.type) {
    case DISMISS_NOTIFICATION: {
      const index = state.notifications.findIndex((notification) => notification === action.payload);
      if (index > -1) {
        state.notifications.splice(index, 1);
      }

      return {
        ...state,
        notifications: [...state.notifications],
      };
    }
    case BASIC_NOTIFICATION:
    case ERROR_NOTIFICATION: {
      let errorMessage = action.payload.message;

      const error = action.payload.error;
      if (!error?.response) {
        errorMessage = `${errorMessage ? errorMessage + ': ' : ''}${error?.message || error}`;
      } else if (error.response.status >= 400 && error.response.status < 500) {
        errorMessage = `${errorMessage ? errorMessage + ': ' : ''}${
          error?.response?.data?.errorMessage || error?.response?.data?.error || error?.response?.data
        }`;
      } else {
        errorMessage = `${errorMessage ? errorMessage + ': ' : ''}${error?.message}`;
      }
      return {
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            type: action.payload.type,
            message: errorMessage,
            expiry: Date.now() + MessageExpiryTime,
            disabled: action.payload.disabled,
          },
        ],
      };
    }
    case SUCCESS_NOTIFICATION:
      return {
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            type: action.payload.type,
            message: action.payload.message,
            expiry: Date.now() + MessageExpiryTime,
            disabled: action.payload.disabled,
          },
        ],
      };
    default:
      return state;
  }
}
