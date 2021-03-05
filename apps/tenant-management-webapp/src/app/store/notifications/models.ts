export interface Notification {
  message: string;
  expiry?: number;
}

export interface NotificationState {
  notifications: Notification[]
}

export const NOTIFICATION_INIT: NotificationState = {
  notifications: []
}
