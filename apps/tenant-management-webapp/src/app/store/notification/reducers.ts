import {
  ActionTypes,
  FETCH_NOTIFICATION_LIST_SUCCESSES,
  DELETE_NOTIFICATION_SUCCESSES,
  FETCH_NOTIFICATION_TYPE_SUCCEEDED,
  DELETE_NOTIFICATION_TYPE_SUCCEEDED,
  UPDATE_NOTIFICATION_TYPE_SUCCEEDED,
} from './actions';
import { NOTIFICATION_INIT, NotificationService } from './models';

function removeSpecifiedNotificationType(notificationTypes, notificationType) {
  const index = notificationTypes.findIndex(({ id }) => id === notificationType.id);
  const newNotificationTypes = notificationTypes.map((x) => Object.assign({}, x));
  newNotificationTypes.splice(index, 1);
  return { ...newNotificationTypes };
}

function updateSpecifiedNotificationType(notificationTypes, notificationType) {
  const index = notificationTypes.findIndex(({ id }) => id === notificationType.id);
  const newNotificationTypes = notificationTypes.map((x) => Object.assign({}, x));
  newNotificationTypes[index] = notificationType;
  return newNotificationTypes;
}

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
      };
    case FETCH_NOTIFICATION_LIST_SUCCESSES:
      return {
        ...state,
        notificationList: action.payload.results.data,
      };
    case FETCH_NOTIFICATION_TYPE_SUCCEEDED:
      return {
        ...state,
        notificationTypes: action.payload.notificationInfo.data,
      };
    case DELETE_NOTIFICATION_TYPE_SUCCEEDED:
      return {
        ...state,
        notificationTypes: removeSpecifiedNotificationType(state.notificationTypes, action.payload),
      };
    case UPDATE_NOTIFICATION_TYPE_SUCCEEDED:
      return {
        ...state,
        notificationTypes: updateSpecifiedNotificationType(state.notificationTypes, action.payload),
      };

    default:
      return state;
  }
}
