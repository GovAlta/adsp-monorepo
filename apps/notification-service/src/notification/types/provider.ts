import { Notification } from '../types';
import { Channel } from './channel';
import * as nodemailer from 'nodemailer';

export interface NotificationProvider {
  send(notification: Notification): Promise<nodemailer.SentMessageInfo>;
}

export interface Providers {
  [Channel.email]?: NotificationProvider;
  [Channel.mail]?: NotificationProvider;
  [Channel.sms]?: NotificationProvider;
}
