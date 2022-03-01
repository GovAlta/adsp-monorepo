export enum Channel {
  email = 'email',
  mail = 'mail',
  sms = 'sms',
  slack = 'slack',
  teams = 'teams',
}

export interface Template {
  subject: unknown;
  body: unknown;
}

export interface NotificationTypeEvent {
  namespace: string;
  name: string;
  templates: Partial<Record<Channel, Template>>;
  channels?: string[];
  customized?: boolean;
}

export interface NotificationType {
  name: string;
  description: string;
  publicSubscribe: boolean;
  manageSubscribe?: boolean;
  subscriberRoles: string[];
  events: NotificationTypeEvent[];
}
