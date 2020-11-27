import { Notification } from '../types';
import { Channel } from './channel';

export interface NotificationProvider {
  send(notification: Notification): Promise<boolean>
}

export interface Providers {
  [Channel.email]?: NotificationProvider,
  [Channel.mail]?: NotificationProvider,
  [Channel.sms]?: NotificationProvider
}
