export interface Notification {
  message: string;
  expiry?: number;
  disabled?: boolean;
}

export interface NotificationState {
  notifications: Notification[];
}

export const NOTIFICATION_INIT: NotificationState = {
  notifications: [],
};
