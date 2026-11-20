import { ServiceDirectory, SupportDetails } from './errors';

export enum MessageType {
  error = 'emergency',
  success = 'information',
}

export interface Notification {
  type?: MessageType;
  message?: string;
  expiry?: number;
  disabled?: boolean;
  error?: unknown;
}

export interface NotificationItem {
  id: string;
  type?: MessageType;
  message?: string;
  details?: SupportDetails;
  expiry?: number;
  disabled?: boolean;
}

export interface NotificationState {
  notifications: NotificationItem[];
  services: ServiceDirectory;
}

export const NOTIFICATION_INIT: NotificationState = {
  notifications: [],
  services: {},
};
