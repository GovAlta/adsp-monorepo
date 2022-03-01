import { ActionTypes, FETCH_NOTIFICATION_TYPE_SUCCEEDED } from './actions';
import { NOTIFICATION_INIT, NotificationState } from './models';

export default function (state = NOTIFICATION_INIT, action: ActionTypes): NotificationState {
  switch (action.type) {
    case FETCH_NOTIFICATION_TYPE_SUCCEEDED: {
      const notificationTypes = action.payload.notificationInfo.data;

      return {
        ...state,
        notificationTypes: notificationTypes,
      };
    }
    default:
      return state;
  }
}
