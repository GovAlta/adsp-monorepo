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
  notifications: (Notification & { id: string })[];
}

export const NOTIFICATION_INIT: NotificationState = {
  notifications: [],
};
