import { ActionTypes } from './actions';
import { NotificationState, NOTIFICATION_INIT } from './models';

export default function (state: NotificationState = NOTIFICATION_INIT, action: ActionTypes): NotificationState {
  switch (action.type) {
    case 'notifications/error': {
      let errorMessage = action.payload.message;
      const error = action.payload.error;
      let additionalMessage = `${error?.message}`;

      if (!error?.response) {
        additionalMessage = `${error?.message || error || ''}`;
      } else if (error.response.status >= 400 && error.response.status < 500) {
        additionalMessage = `${
          error?.response?.data?.errorMessage || error?.response?.data?.error || error?.response?.data || ''
        }`;
      }
      const spacer = additionalMessage.length > 0 ? ': ' : '';
      errorMessage = `${errorMessage}${spacer}${additionalMessage}`;

      return {
        notification: {
          message: errorMessage,
          type: 'emergency',
          dispatch: action.payload.dispatch,
        },
      };
    }
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
