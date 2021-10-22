import { Channel, NotificationContent } from '../types';

export interface NotificationProvider {
  send(notification: NotificationContent): Promise<void>;
}

export type Providers = Partial<Record<Channel, NotificationProvider>>;
