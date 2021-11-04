import { ActionTypes, FETCH_CORE_NOTIFICATION_TYPE_SUCCEEDED, FETCH_NOTIFICATION_TYPE_SUCCEEDED } from './actions';
import { NOTIFICATION_INIT, NotificationService } from './models';

export default function (state = NOTIFICATION_INIT, action: ActionTypes): NotificationService {
  switch (action.type) {
    case FETCH_NOTIFICATION_TYPE_SUCCEEDED:
      return {
        ...state,
        notificationTypes: action.payload.notificationInfo.data,
      };
    case FETCH_CORE_NOTIFICATION_TYPE_SUCCEEDED:
      return {
        ...state,
        core: action.payload.notificationInfo.data,
      };
    default:
      return state;
  }
}
