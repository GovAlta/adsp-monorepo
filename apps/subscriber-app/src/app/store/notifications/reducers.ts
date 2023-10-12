import { ActionTypes } from './actions';
import { NotificationState, NOTIFICATION_INIT } from './models';

export default function (state: NotificationState = NOTIFICATION_INIT, action: ActionTypes): NotificationState {
  switch (action.type) {
    case 'notifications/error': {
       let errorMessage = action.payload.message;

      const error = action.payload.error;

      if (!error?.response) {
        errorMessage = `${errorMessage ? errorMessage + ': ' : ''}${error?.message || error}`;
      } else if (error.response.status >= 400 && error.response.status < 500) {
        errorMessage = `${errorMessage ? errorMessage + ': ' : ''}${
          error?.response?.data?.errorMessage || error?.response?.data?.error || error?.response?.data
        }`;
      }
      return {
        notification: {
          message:  errorMessage,
          type: 'emergency',
        },
      };
    } case 'notifications/success':
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
