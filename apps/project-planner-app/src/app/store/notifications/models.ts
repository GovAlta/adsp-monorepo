export enum MessageType {
  error = 'error',
  success = 'success',
}

export interface Notification {
  id?: string;
  message: string;
  type?: MessageType;
}

export interface NotificationState {
  notifications: Notification[];
}
