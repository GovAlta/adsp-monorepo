import { Notification } from './models';

export const ERROR_NOTIFICATION = 'notifications/error';
export const SUCCESS_NOTIFICATION = 'notifications/success';

export const BASIC_NOTIFICATION = 'notifications/basic';
export const CLEAR_NOTIFICATION = 'notifications/clear';

export type ActionTypes =
  | ClearNotificationAction
  | ErrorNotificationAction
  | SuccessNotificationAction
  | BasicNotificationAction;

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
interface ClearNotificationAction {
  type: typeof CLEAR_NOTIFICATION;
}

export const clearNotification = (): ClearNotificationAction => ({
  type: CLEAR_NOTIFICATION,
});
export const ErrorNotification = (payload: Notification): ErrorNotificationAction => ({
  type: ERROR_NOTIFICATION,
  payload,
});

export const SuccessNotification = (payload: Notification): SuccessNotificationAction => ({
  type: SUCCESS_NOTIFICATION,
  payload,
});

export const BasicNotification = (payload: Notification): BasicNotificationAction => ({
  type: BASIC_NOTIFICATION,
  payload,
});
