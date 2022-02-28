import { NotificationType } from './models';

export const FETCH_NOTIFICATION_TYPE = 'tenant/notification-service/notificationType/fetch';
export const FETCH_NOTIFICATION_TYPE_SUCCEEDED = 'notification-service/space/notificationType/succeeded';

// =============
// Actions Types
// =============

export type ActionTypes = FetchNotificationTypeSucceededAction | FetchNotificationTypeAction;

interface FetchNotificationTypeSucceededAction {
  type: typeof FETCH_NOTIFICATION_TYPE_SUCCEEDED;
  payload: {
    notificationInfo: { data: NotificationType };
  };
}

interface FetchNotificationTypeAction {
  type: typeof FETCH_NOTIFICATION_TYPE;
}

// ==============
// Action Methods
// ==============

export const FetchNotificationTypeSucceededService = (notificationInfo: {
  data: NotificationType;
}): FetchNotificationTypeSucceededAction => ({
  type: FETCH_NOTIFICATION_TYPE_SUCCEEDED,
  payload: {
    notificationInfo,
  },
});

export const FetchNotificationTypeService = (): FetchNotificationTypeAction => ({
  type: FETCH_NOTIFICATION_TYPE,
});
