import {
  ActionTypes,
  FETCH_NOTIFICATION_LIST_SUCCESSES,
  DELETE_NOTIFICATION_SUCCESSES,
  FETCH_NOTIFICATION_TYPE_SUCCEEDED,
} from './actions';
import { NOTIFICATION_INIT, NotificationService } from './models';

function deleteNotification(notificationList, notification) {
  const index = notificationList.findIndex(({ id }) => id === notification.id);
  const newNotificationList = notificationList.map((x) => Object.assign({}, x));
  newNotificationList.splice(index, 1);
  return newNotificationList;
}
export default function (state = NOTIFICATION_INIT, action: ActionTypes): NotificationService {
  switch (action.type) {
    case DELETE_NOTIFICATION_SUCCESSES:
      return {
        ...state, // remove delete notification from reducer
        notificationList: deleteNotification(state.notificationList, action.payload.data),
        loaded: true,
      };
    case FETCH_NOTIFICATION_LIST_SUCCESSES:
      return {
        ...state,
        notificationList: action.payload.results.data,
        loaded: true,
      };
    case FETCH_NOTIFICATION_TYPE_SUCCEEDED:
      return {
        ...state,
        notificationTypes: action.payload.notificationInfo.data,
        loaded: true,
      };
    default:
      return state;
  }
}
