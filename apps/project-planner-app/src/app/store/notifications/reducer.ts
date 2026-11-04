import { ActionTypes, DISMISS_NOTIFICATION, ERROR_NOTIFICATION, SUCCESS_NOTIFICATION } from './actions';
import { NotificationState } from './models';

const initialState: NotificationState = { notifications: [] };

export function notificationsReducer(state = initialState, action: ActionTypes): NotificationState {
  switch (action.type) {
    case ERROR_NOTIFICATION:
    case SUCCESS_NOTIFICATION:
      return { notifications: [...state.notifications, action.payload] };
    case DISMISS_NOTIFICATION:
      return { notifications: state.notifications.filter((notification) => notification !== action.payload) };
    default:
      return state;
  }
}
