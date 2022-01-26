import { ActionTypes } from './actions';
import { NotificationState, NOTIFICATION_INIT } from './models';

const MessageExpiryTime = 5000;

export default function (state: NotificationState = NOTIFICATION_INIT, action: ActionTypes): NotificationState {
  switch (action.type) {
    case 'notifications/basic':
    case 'notifications/error':
    case 'notifications/success':
      return {
        notifications: [
          ...state.notifications,
          {
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
