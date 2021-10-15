import { Channel, Notification } from '../types';

export interface NotificationProvider {
  send(notification: Notification): Promise<void>;
}

export type Providers = Partial<Record<Channel, NotificationProvider>>;
