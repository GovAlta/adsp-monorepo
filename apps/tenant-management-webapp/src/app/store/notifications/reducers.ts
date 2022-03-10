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
      const newState = { ...state };
      const index = newState.notifications.findIndex((notification) => notification === action.payload);
      if (index > -1) {
        newState.notifications.splice(index, 1);
      }

      return newState;
    }
    case BASIC_NOTIFICATION:
    case ERROR_NOTIFICATION:
    case SUCCESS_NOTIFICATION:
      return {
        notifications: [
          ...state.notifications,
          {
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
