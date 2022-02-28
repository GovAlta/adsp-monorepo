import {
  ContactInformation,
  InstalledSlackTeam,
  NotificationItem,
  NotificationMetrics,
  NotificationType,
} from './models';

export const DELETE_NOTIFICATION = 'tenant/notification-service/notification/delete';
export const DELETE_NOTIFICATION_FAILED = 'tenant/notification-service/notification/delete/fail';

export const FETCH_NOTIFICATION_TYPE = 'tenant/notification-service/notificationType/fetch';
export const FETCH_CORE_NOTIFICATION_TYPE = 'tenant/core-notification-service/notificationType/fetch';
export const FETCH_NOTIFICATION_TYPE_SUCCEEDED = 'notification-service/space/notificationType/succeeded';
export const FETCH_CORE_NOTIFICATION_TYPE_SUCCEEDED = 'notification-service-core/space/notificationType/succeeded';

export const DELETE_NOTIFICATION_TYPE = 'tenant/notification-service/notificationType/delete';

export const UPDATE_NOTIFICATION_TYPE = 'tenant/notification-service/notificationType/update';

export const FETCH_NOTIFICATION_TYPE_HAS_NOTIFICATION = 'notification-service/docs/fetch/notification/notificationtype';
export const FETCH_NOTIFICATION_TYPE_HAS_NOTIFICATION_SUCCEEDED =
  'notification-service/docs/fetch/notification/notificationtype/succeeded';

export const FETCH_NOTIFICATION_METRICS = 'tenant/notification-service/metrics/fetch';
export const FETCH_NOTIFICATION_METRICS_SUCCEEDED = 'tenant/notification-service/metrics/fetch/succeeded';
export const UPDATE_CONTACT_INFORMATION = 'tenant/notification-service/contact-information';

export const FETCH_NOTIFICATION_SLACK_INSTALLATION = 'tenant/notification-service/slack-install/fetch';
export const FETCH_NOTIFICATION_SLACK_INSTALLATION_SUCCEEDED =
  'tenant/notification-service/slack-install/fetch/succeeded';

// =============
// Actions Types
// =============

export type ActionTypes =
  | DeleteNotificationFailedAction
  | FetchNotificationTypeSucceededAction
  | FetchCoreNotificationTypeSucceededAction
  | FetchNotificationTypeAction
  | FetchCoreNotificationTypeAction
  | UpdateNotificationTypeAction
  | DeleteNotificationTypeAction
  | FetchNotificationMetricsAction
  | FetchNotificationMetricsSucceededAction
  | FetchNotificationSlackInstallationAction
  | FetchNotificationSlackInstallationSucceededAction;

interface DeleteNotificationFailedAction {
  type: typeof DELETE_NOTIFICATION_FAILED;
  payload: { data: string };
}

interface FetchNotificationTypeSucceededAction {
  type: typeof FETCH_NOTIFICATION_TYPE_SUCCEEDED;
  payload: {
    notificationInfo: { data: NotificationType };
  };
}

interface FetchCoreNotificationTypeSucceededAction {
  type: typeof FETCH_CORE_NOTIFICATION_TYPE_SUCCEEDED;
  payload: {
    notificationInfo: { data: NotificationType };
  };
}

interface FetchNotificationTypeAction {
  type: typeof FETCH_NOTIFICATION_TYPE;
}

interface FetchCoreNotificationTypeAction {
  type: typeof FETCH_CORE_NOTIFICATION_TYPE;
}

export interface UpdateNotificationTypeAction {
  type: typeof UPDATE_NOTIFICATION_TYPE;
  payload: NotificationItem;
}

export interface UpdateContactInformationAction {
  type: typeof UPDATE_CONTACT_INFORMATION;
  payload: ContactInformation;
}

export interface DeleteNotificationTypeAction {
  type: typeof DELETE_NOTIFICATION_TYPE;
  payload: NotificationItem;
}

interface FetchNotificationMetricsAction {
  type: typeof FETCH_NOTIFICATION_METRICS;
}

interface FetchNotificationMetricsSucceededAction {
  type: typeof FETCH_NOTIFICATION_METRICS_SUCCEEDED;
  metrics: NotificationMetrics;
}

interface FetchNotificationSlackInstallationAction {
  type: typeof FETCH_NOTIFICATION_SLACK_INSTALLATION;
}

interface FetchNotificationSlackInstallationSucceededAction {
  type: typeof FETCH_NOTIFICATION_SLACK_INSTALLATION_SUCCEEDED;
  teams: InstalledSlackTeam[];
  authorizationUrl: string;
}

// ==============
// Action Methods
// ==============

export const DeleteNotificationFailedService = (data: string): DeleteNotificationFailedAction => ({
  type: DELETE_NOTIFICATION_FAILED,
  payload: {
    data,
  },
});

export const FetchNotificationTypeSucceededService = (notificationInfo: {
  data: NotificationType;
}): FetchNotificationTypeSucceededAction => ({
  type: FETCH_NOTIFICATION_TYPE_SUCCEEDED,
  payload: {
    notificationInfo,
  },
});

export const FetchCoreNotificationTypeSucceededService = (notificationInfo: {
  data: NotificationType;
}): FetchCoreNotificationTypeSucceededAction => ({
  type: FETCH_CORE_NOTIFICATION_TYPE_SUCCEEDED,
  payload: {
    notificationInfo,
  },
});

export const FetchNotificationTypeService = (): FetchNotificationTypeAction => ({
  type: FETCH_NOTIFICATION_TYPE,
});

export const FetchCoreNotificationTypeService = (): FetchCoreNotificationTypeAction => ({
  type: FETCH_CORE_NOTIFICATION_TYPE,
});

export const UpdateNotificationTypeService = (notificationType: NotificationItem): UpdateNotificationTypeAction => ({
  type: UPDATE_NOTIFICATION_TYPE,
  payload: notificationType,
});

export const UpdateContactInformationService = (
  contactInformation: ContactInformation
): UpdateContactInformationAction => ({
  type: UPDATE_CONTACT_INFORMATION,
  payload: contactInformation,
});

export const DeleteNotificationTypeService = (notificationType: NotificationItem): DeleteNotificationTypeAction => ({
  type: DELETE_NOTIFICATION_TYPE,
  payload: notificationType,
});

export const FetchNotificationMetrics = (): FetchNotificationMetricsAction => ({
  type: FETCH_NOTIFICATION_METRICS,
});

export const FetchNotificationMetricsSucceeded = (
  metrics: NotificationMetrics
): FetchNotificationMetricsSucceededAction => ({
  type: FETCH_NOTIFICATION_METRICS_SUCCEEDED,
  metrics,
});

export const FetchNotificationSlackInstallation = (): FetchNotificationSlackInstallationAction => ({
  type: FETCH_NOTIFICATION_SLACK_INSTALLATION,
});

export const FetchNotificationSlackInstallationSucceeded = (
  teams: InstalledSlackTeam[],
  authorizationUrl: string
): FetchNotificationSlackInstallationSucceededAction => ({
  type: FETCH_NOTIFICATION_SLACK_INSTALLATION_SUCCEEDED,
  teams,
  authorizationUrl,
});
