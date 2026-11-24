import { v4 as uuidv4 } from 'uuid';
import {
  ActionTypes,
  BASIC_NOTIFICATION,
  DISMISS_NOTIFICATION,
  ERROR_NOTIFICATION,
  SUCCESS_NOTIFICATION,
} from './actions';
import { FETCH_CONFIG_SUCCESS_ACTION, FetchConfigSuccessAction } from '@store/config/actions';
import { describeError } from './errors';
import { NotificationState, NOTIFICATION_INIT } from './models';

const MessageExpiryTime = 5000;

export default function (
  state: NotificationState = NOTIFICATION_INIT,
  action: ActionTypes | FetchConfigSuccessAction,
): NotificationState {
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
    case FETCH_CONFIG_SUCCESS_ACTION:
      return {
        ...state,
        services: action.payload.directory ?? state.services,
      };
    case BASIC_NOTIFICATION:
    case ERROR_NOTIFICATION: {
      const { message, details } = describeError(action.payload.message, action.payload.error, state.services);
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            type: action.payload.type,
            message,
            details: details && { ...details, page: window.location.pathname, time: new Date().toISOString() },
            expiry: Date.now() + MessageExpiryTime,
            disabled: action.payload.disabled,
          },
        ],
      };
    }
    case SUCCESS_NOTIFICATION:
      return {
        ...state,
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
