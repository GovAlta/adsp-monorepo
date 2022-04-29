export interface Notification {
  message: string;
  expiry?: number;
  type?: NotificationType;
}
type NotificationType = 'important' | 'information' | 'event' | 'emergency';

export interface NotificationState {
  notification: Notification;
}

export const NOTIFICATION_INIT: NotificationState = {
  notification: undefined,
};
