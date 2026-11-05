import { Notification, MessageType } from './models';

export const ERROR_NOTIFICATION = 'notifications/error';
export const SUCCESS_NOTIFICATION = 'notifications/success';
export const DISMISS_NOTIFICATION = 'notifications/dismiss';

interface ErrorNotificationAction {
  type: typeof ERROR_NOTIFICATION;
  payload: Notification;
}

interface SuccessNotificationAction {
  type: typeof SUCCESS_NOTIFICATION;
  payload: Notification;
}

interface DismissNotificationAction {
  type: typeof DISMISS_NOTIFICATION;
  payload: Notification;
}

export type ActionTypes = ErrorNotificationAction | SuccessNotificationAction | DismissNotificationAction;

export const ErrorNotification = (payload: Notification): ErrorNotificationAction => ({
  type: ERROR_NOTIFICATION,
  payload: { ...payload, type: MessageType.error },
});

export const SuccessNotification = (payload: Notification): SuccessNotificationAction => ({
  type: SUCCESS_NOTIFICATION,
  payload: { ...payload, type: MessageType.success },
});

export const DismissNotification = (payload: Notification): DismissNotificationAction => ({
  type: DISMISS_NOTIFICATION,
  payload,
});
