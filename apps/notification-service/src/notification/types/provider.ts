import { Channel, Notification } from '../types';

export interface NotificationProvider {
  send(notification: Notification): Promise<void>;
}

export interface Providers {
  [Channel.email]?: NotificationProvider;
  [Channel.mail]?: NotificationProvider;
  [Channel.sms]?: NotificationProvider;
}
