import { NotificationItem } from './models';

export const FETCH_NOTIFICATION_LIST = 'tenant/notification-service/notification/fetch';
export const FETCH_NOTIFICATION_LIST_SUCCESSES = 'tenant/notification-service/notification/fetch/success';
export const FETCH_NOTIFICATION_LIST_FAILED = 'tenant/notification-service/notification/fetch/fail';

export const DELETE_NOTIFICATION = 'tenant/notification-service/notification/delete';
export const DELETE_NOTIFICATION_SUCCESSES = 'tenant/notification-service/notification/delete/success';
export const DELETE_NOTIFICATION_FAILED = 'tenant/notification-service/notification/delete/fail';

export const FETCH_NOTIFICATION_TYPE = 'tenant/notification-service/notificationType/fetch';
export const FETCH_NOTIFICATION_TYPE_SUCCEEDED = 'notification-service/space/notificationType/succeeded';

export const DELETE_NOTIFICATION_TYPE = 'tenant/notification-service/notificationType/delete';
export const DELETE_NOTIFICATION_TYPE_SUCCEEDED = 'notification-service/notificationType/delete/success';

export const UPDATE_NOTIFICATION_TYPE = 'tenant/notification-service/notificationType/update';
export const UPDATE_NOTIFICATION_TYPE_SUCCEEDED = 'notification-service/notificationType/update/success';

export const FETCH_NOTIFICATION_TYPE_HAS_NOTIFICATION = 'notification-service/docs/fetch/notification/notificationtype';
export const FETCH_NOTIFICATION_TYPE_HAS_NOTIFICATION_SUCCEEDED =
  'notification-service/docs/fetch/notification/notificationtype/succeeded';

// =============
// Actions Types
// =============

export type ActionTypes =
  | FetchNotificationsAction
  | FetchNotificationsSuccessAction
  | FetchNotificationsFailedAction
  | DeleteNotificationAction
  | DeleteNotificationSuccessAction
  | DeleteNotificationFailedAction
  | FetchNotificationTypeSucceededAction
  | DeleteNotificationTypeSucceededAction
  | UpdateNotificationTypeSucceededAction
  | FetchNotificationTypeAction
  | UpdateNotificationTypeAction
  | DeleteNotificationTypeAction;

interface FetchNotificationsAction {
  type: typeof FETCH_NOTIFICATION_LIST;
}

interface FetchNotificationsSuccessAction {
  type: typeof FETCH_NOTIFICATION_LIST_SUCCESSES;
  payload: {
    results: { data: NotificationItem[] };
  };
}

interface FetchNotificationsFailedAction {
  type: typeof FETCH_NOTIFICATION_LIST_FAILED;
  payload: { data: string };
}

export interface DeleteNotificationAction {
  type: typeof DELETE_NOTIFICATION;
  payload: { data: string };
}

interface DeleteNotificationSuccessAction {
  type: typeof DELETE_NOTIFICATION_SUCCESSES;
  payload: { data: string };
}
interface DeleteNotificationFailedAction {
  type: typeof DELETE_NOTIFICATION_FAILED;
  payload: { data: string };
}

interface FetchNotificationTypeSucceededAction {
  type: typeof FETCH_NOTIFICATION_TYPE_SUCCEEDED;
  payload: {
    notificationInfo: { data: NotificationItem[] };
  };
}
interface DeleteNotificationTypeSucceededAction {
  type: typeof DELETE_NOTIFICATION_TYPE_SUCCEEDED;
  payload: {
    notificationInfo: { data: string };
  };
}

interface UpdateNotificationTypeSucceededAction {
  type: typeof UPDATE_NOTIFICATION_TYPE_SUCCEEDED;
  payload: NotificationItem;
}

interface FetchNotificationTypeAction {
  type: typeof FETCH_NOTIFICATION_TYPE;
}

export interface UpdateNotificationTypeAction {
  type: typeof UPDATE_NOTIFICATION_TYPE;
  payload: NotificationItem;
}

export interface DeleteNotificationTypeAction {
  type: typeof DELETE_NOTIFICATION_TYPE;
  payload: NotificationItem;
}

// ==============
// Action Methods
// ==============

export const FetchNotificationsService = (): FetchNotificationsAction => ({
  type: FETCH_NOTIFICATION_LIST,
});

export const FetchNotificationsSuccessService = (results: {
  data: NotificationItem[];
}): FetchNotificationsSuccessAction => ({
  type: FETCH_NOTIFICATION_LIST_SUCCESSES,
  payload: {
    results,
  },
});

export const FetchNotificationsFailedService = (data: string): FetchNotificationsFailedAction => ({
  type: FETCH_NOTIFICATION_LIST_FAILED,
  payload: {
    data,
  },
});

export const DeleteNotificationService = (data: string): DeleteNotificationAction => ({
  type: DELETE_NOTIFICATION,
  payload: {
    data,
  },
});

export const DeleteNotificationSuccessService = (data: string): DeleteNotificationSuccessAction => ({
  type: DELETE_NOTIFICATION_SUCCESSES,
  payload: {
    data,
  },
});

export const DeleteNotificationFailedService = (data: string): DeleteNotificationFailedAction => ({
  type: DELETE_NOTIFICATION_FAILED,
  payload: {
    data,
  },
});

export const FetchNotificationTypeSucceededService = (notificationInfo: {
  data: NotificationItem[];
}): FetchNotificationTypeSucceededAction => ({
  type: FETCH_NOTIFICATION_TYPE_SUCCEEDED,
  payload: {
    notificationInfo,
  },
});

export const DeleteNotificationTypeSucceededService = (notificationInfo: {
  data: string;
}): DeleteNotificationTypeSucceededAction => {
  return {
    type: DELETE_NOTIFICATION_TYPE_SUCCEEDED,
    payload: {
      notificationInfo,
    },
  };
};

export const UpdateNotificationTypeSucceededService = (
  notificationType: NotificationItem
): UpdateNotificationTypeSucceededAction => ({
  type: UPDATE_NOTIFICATION_TYPE_SUCCEEDED,
  payload: notificationType,
});

export const FetchNotificationTypeService = (): FetchNotificationTypeAction => ({
  type: FETCH_NOTIFICATION_TYPE,
});

export const UpdateNotificationTypeService = (notificationType: NotificationItem): UpdateNotificationTypeAction => ({
  type: UPDATE_NOTIFICATION_TYPE,
  payload: notificationType,
});

export const DeleteNotificationTypeService = (notificationType: NotificationItem): DeleteNotificationTypeAction => ({
  type: DELETE_NOTIFICATION_TYPE,
  payload: notificationType,
});
