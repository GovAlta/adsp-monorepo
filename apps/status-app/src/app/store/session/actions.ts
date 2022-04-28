import { Notification, Indicator, ElementIndicator } from './models'
export const UPDATE_IS_READY = 'session/loading/ready/update';
export const ADD_NOTIFICATIONS = 'session/notifications/add';
export const CLEAR_NOTIFICATIONS = 'session/notifications/clear';
export const UPDATE_TENANT_NAME = 'session/tenant/name/update';
export const UPDATE_INDICATOR = 'session/indicator';
export const UPDATE_ELEMENT_INDICATOR = 'session/elementIndicator';

export type ActionTypes = UpdateIsAction | AddNotificationAction | UpdateTenantNameAction | ClearNotificationAction   | UpdateIndicatorAction
| UpdateElementIndicatorAction;

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

export interface ClearNotificationAction {
  type: typeof CLEAR_NOTIFICATIONS;
}

export interface UpdateTenantNameAction {
  type: typeof UPDATE_TENANT_NAME;
  payload: string;
}

export interface UpdateIndicatorAction {
  type: typeof UPDATE_INDICATOR;
  payload: Indicator;
}

export interface UpdateElementIndicatorAction {
  type: typeof UPDATE_ELEMENT_INDICATOR;
  payload: ElementIndicator;
}

export const updateIsReady = (isReady: boolean): UpdateIsAction => ({
  type: 'session/loading/ready/update',
  payload: isReady
});

export const addNotification = (notification: Notification): AddNotificationAction => ({
  type: 'session/notifications/add',
  payload: notification
});

export const clearNotification = (): ClearNotificationAction => ({
  type: 'session/notifications/clear'
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

export const UpdateElementIndicator = (elementIndicator: ElementIndicator): UpdateElementIndicatorAction => ({
  type: UPDATE_ELEMENT_INDICATOR,
  payload: elementIndicator,
});

export const UpdateIndicator = (indicator: Indicator): UpdateIndicatorAction => ({
  type: UPDATE_INDICATOR,
  payload: indicator,
});

