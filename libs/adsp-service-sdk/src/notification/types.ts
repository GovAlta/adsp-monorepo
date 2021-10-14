export enum Channel {
  email = 'email',
  mail = 'mail',
  sms = 'sms',
}

export interface Template {
  subject: unknown;
  body: unknown;
}

export interface NotificationTypeEvent {
  namespace: string;
  name: string;
  templates: Partial<Record<Channel, Template>>;
}

export interface NotificationType {
  name: string;
  description: string;
  publicSubscribe: boolean;
  subscriberRoles: string[];
  events: NotificationTypeEvent[];
}
