import { Notification } from './models';

export const ERROR_NOTIFICATION = 'notifications/error';
export const SUCCESS_NOTIFICATION = 'notifications/success';

export const BASIC_NOTIFICATION = 'notifications/basic';

export type ActionTypes = ErrorNotificationAction | SuccessNotificationAction | BasicNotificationAction;

interface ErrorNotificationAction {
  type: typeof ERROR_NOTIFICATION;
  payload: Notification;
}

interface SuccessNotificationAction {
  type: typeof SUCCESS_NOTIFICATION;
  payload: Notification;
}

interface BasicNotificationAction {
  type: typeof BASIC_NOTIFICATION;
  payload: Notification;
}

export const ErrorNotification = (payload: Notification): ErrorNotificationAction => ({
  type: 'notifications/error',
  payload,
});

export const SuccessNotification = (payload: Notification): SuccessNotificationAction => ({
  type: 'notifications/success',
  payload,
});

export const BasicNotification = (payload: Notification): BasicNotificationAction => ({
  type: 'notifications/basic',
  payload,
});
