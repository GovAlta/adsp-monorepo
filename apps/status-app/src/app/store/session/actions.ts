import { Notification } from './models'
export const UPDATE_IS_READY = 'session/loading/ready/update';
export const ADD_NOTIFICATIONS = 'session/notifications/add';
export const UPDATE_TENANT_NAME = 'session/tenant/name/update';

export type ActionTypes = UpdateIsAction | AddNotificationAction | UpdateTenantNameAction;

export interface UpdateIsReady {
  type: typeof UPDATE_IS_READY;
}

export interface UpdateIsAction {
  type: typeof UPDATE_IS_READY;
  payload: boolean;
}

export interface AddNotificationAction {
  type: typeof ADD_NOTIFICATIONS;
  payload: Notification;
}
export interface UpdateTenantNameAction {
  type: typeof UPDATE_TENANT_NAME;
  payload: string;
}

export const updateIsReady = (isReady: boolean): UpdateIsAction => ({
  type: 'session/loading/ready/update',
  payload: isReady
});

export const addNotification = (notification: Notification): AddNotificationAction => ({
  type: 'session/notifications/add',
  payload: notification
});

export const addErrorMessage = (notification: Notification): AddNotificationAction => ({
  type: 'session/notifications/add',
  payload: {
    type: 'error', ...notification
  }
});

export const updateTenantName = (name: string): UpdateTenantNameAction => ({
  type: 'session/tenant/name/update',
  payload: name
});