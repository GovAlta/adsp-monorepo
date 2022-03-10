import { ContactInformation, NotificationItem, NotificationMetrics } from './models';

export const DELETE_NOTIFICATION = 'tenant/notification-service/notification/delete';
export const DELETE_NOTIFICATION_FAILED = 'tenant/notification-service/notification/delete/fail';

export const FETCH_NOTIFICATION_CONFIGURATION = 'tenant/notification-service/notificationConfig/fetch';
export const FETCH_NOTIFICATION_CONFIGURATION_SUCCEEDED = 'notification-service/space/notificationConfig/succeeded';
export const FETCH_CORE_NOTIFICATION_TYPES = 'tenant/core-notification-service/notificationType/fetch';
export const FETCH_CORE_NOTIFICATION_TYPES_SUCCEEDED = 'notification-service-core/space/notificationType/succeeded';

export const DELETE_NOTIFICATION_TYPE = 'tenant/notification-service/notificationType/delete';

export const UPDATE_NOTIFICATION_TYPE = 'tenant/notification-service/notificationType/update';

export const FETCH_NOTIFICATION_TYPE_HAS_NOTIFICATION = 'notification-service/docs/fetch/notification/notificationtype';
export const FETCH_NOTIFICATION_TYPE_HAS_NOTIFICATION_SUCCEEDED =
  'notification-service/docs/fetch/notification/notificationtype/succeeded';

export const FETCH_NOTIFICATION_METRICS = 'tenant/notification-service/metrics/fetch';
export const FETCH_NOTIFICATION_METRICS_SUCCEEDED = 'tenant/notification-service/metrics/fetch/succeeded';
export const UPDATE_CONTACT_INFORMATION = 'tenant/notification-service/contact-information';

// =============
// Actions Types
// =============

export type ActionTypes =
  | DeleteNotificationFailedAction
  | FetchNotificationConfigurationSucceededAction
  | FetchCoreNotificationTypeSucceededAction
  | FetchNotificationConfigurationAction
  | FetchCoreNotificationTypeAction
  | UpdateNotificationTypeAction
  | DeleteNotificationTypeAction
  | FetchNotificationMetricsAction
  | FetchNotificationMetricsSucceededAction;

interface DeleteNotificationFailedAction {
  type: typeof DELETE_NOTIFICATION_FAILED;
  payload: { data: string };
}

interface FetchNotificationConfigurationSucceededAction {
  type: typeof FETCH_NOTIFICATION_CONFIGURATION_SUCCEEDED;
  payload: {
    notificationInfo: { data: Record<string, NotificationItem> };
    contact: ContactInformation;
  };
}

interface FetchCoreNotificationTypeSucceededAction {
  type: typeof FETCH_CORE_NOTIFICATION_TYPES_SUCCEEDED;
  payload: {
    notificationInfo: { data: Record<string, NotificationItem> };
  };
}

interface FetchNotificationConfigurationAction {
  type: typeof FETCH_NOTIFICATION_CONFIGURATION;
}

interface FetchCoreNotificationTypeAction {
  type: typeof FETCH_CORE_NOTIFICATION_TYPES;
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

// ==============
// Action Methods
// ==============

export const DeleteNotificationFailedService = (data: string): DeleteNotificationFailedAction => ({
  type: DELETE_NOTIFICATION_FAILED,
  payload: {
    data,
  },
});

export const FetchNotificationConfigurationSucceededService = (
  notificationInfo: {
    data: Record<string, NotificationItem>;
  },
  contact: ContactInformation
): FetchNotificationConfigurationSucceededAction => ({
  type: FETCH_NOTIFICATION_CONFIGURATION_SUCCEEDED,
  payload: {
    notificationInfo,
    contact,
  },
});

export const FetchCoreNotificationTypeSucceededService = (notificationInfo: {
  data: Record<string, NotificationItem>;
}): FetchCoreNotificationTypeSucceededAction => ({
  type: FETCH_CORE_NOTIFICATION_TYPES_SUCCEEDED,
  payload: {
    notificationInfo,
  },
});

export const FetchNotificationConfigurationService = (): FetchNotificationConfigurationAction => ({
  type: FETCH_NOTIFICATION_CONFIGURATION,
});

export const FetchCoreNotificationTypesService = (): FetchCoreNotificationTypeAction => ({
  type: FETCH_CORE_NOTIFICATION_TYPES,
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
