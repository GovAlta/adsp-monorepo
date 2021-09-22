import { Notification } from './models'
export const UPDATE_IS_READY = 'session/loading/ready/update';
export const ADD_NOTIFICATIONS = 'session/notifications/add'

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

export type ActionTypes = UpdateIsAction | AddNotificationAction

export const updateIsReady = (isReady: boolean): UpdateIsAction => ({
  type: 'session/loading/ready/update',
  payload: isReady
});

export const addNotification = (notification: Notification): AddNotificationAction => ({
  type: 'session/notifications/add',
  payload: notification
})

export const addErrorMessage = (notification: Notification): AddNotificationAction => ({
  type: 'session/notifications/add',
  payload: {
    type: 'error', ...notification
  }
})