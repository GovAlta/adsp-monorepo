export enum Channel {
  email = 'email',
  mail = 'mail',
  sms = 'sms',
  bot = 'bot',
}

export interface Template {
  subject: unknown;
  body: unknown;
  title?: string;
  subtitle?: string;
}

export interface NotificationTypeEvent {
  namespace: string;
  name: string;
  templates: Partial<Record<Channel, Template>>;
  customized?: boolean;
}

export interface NotificationType {
  name: string;
  displayName?: string;
  description: string;
  publicSubscribe: boolean;
  manageSubscribe?: boolean;
  subscriberRoles: string[];
  events: NotificationTypeEvent[];
  channels: Channel[];
  addressPath?: string;
  ccPath?: string;
  bccPath?: string;
  attachmentPath?: string;
  subjectPath?: string;
  titlePath?: string;
  subTitlePath?: string;
}
