export enum MessageType {
  error = 'error',
  success = 'success',
}

export interface Notification {
  message: string;
  type?: MessageType;
}

export interface NotificationState {
  notifications: Notification[];
}
