import { ActionTypes } from './actions';
import { NotificationState, NOTIFICATION_INIT } from './models';

export default function (state: NotificationState = NOTIFICATION_INIT, action: ActionTypes): NotificationState {
  switch (action.type) {
    case 'notifications/error':
      return {
        notification: {
          message: action.payload.message,
          type: 'emergency',
        },
      };
    case 'notifications/success':
      return {
        notification: {
          message: action.payload.message,
          type: 'information',
        },
      };
    case 'notifications/clear':
      return {
        notification: undefined,
      };
    default:
      return state;
  }
}
