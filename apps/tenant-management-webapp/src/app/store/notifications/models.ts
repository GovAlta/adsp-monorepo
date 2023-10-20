export enum MessageType {
  error = 'emergency',
  success = 'information',
}

export interface Notification {
  type?: MessageType;
  message?: string;
  expiry?: number;
  disabled?: boolean;
  error?: ErrorResponse;
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
  headers: unknown;
  config: {
    url: string;
    method: string;
    headers: {
      Accept: string;
      Authorization: string;
    };
  };
}

export interface NotificationState {
  notifications: (Notification & { id: string })[];
}

export const NOTIFICATION_INIT: NotificationState = {
  notifications: [],
};
