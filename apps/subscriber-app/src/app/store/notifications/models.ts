export interface Notification {
  message?: string;
  expiry?: number;
  type?: NotificationType;
  error?: ErrorResponse;
  dispatch?: { channel: string; loggedIn: boolean };
}

interface ErrorResponse {
  message?: string;
  response?: ResponseObject;
}

interface ResponseObject {
  data: {
    errorMessage?: string;
    error?: string;
  };
  status: number;
  statusText: string;
  headers: object;
  config: {
    url: string;
    method: string;
    headers: {
      Accept: string;
      Authorization: string;
    };
  };
}

type NotificationType = 'important' | 'information' | 'event' | 'emergency';

export interface NotificationState {
  notification: Notification;
}

export const NOTIFICATION_INIT: NotificationState = {
  notification: undefined,
};
