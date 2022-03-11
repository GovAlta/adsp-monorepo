export enum MessageType {
  error = 'emergency',
  success = 'information',
}

export interface Notification {
  type?: MessageType;
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
