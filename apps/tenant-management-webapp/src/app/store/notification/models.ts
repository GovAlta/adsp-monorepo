export interface NotificationItem {
  name: string;
  description?: string;
  events: Array<EventItem>;
  subscriberRoles: string[];
  channels: string[];
  sortedChannels?: string[];
  id: string;
  publicSubscribe: boolean;
  customized?: boolean;
  manageSubscribe?: boolean;
}

export enum Channel {
  email = 'email',
  mail = 'mail',
  sms = 'sms',
  bot = 'bot',
}

export interface Channels {
  channel: string;
  address: string;
  verified: boolean;
}

export interface ContactInformation {
  contactEmail?: string;
  phoneNumber?: string;
  supportInstructions?: string;
}

export interface EventItem {
  name: string;
  namespace?: string;
  templates?: Template;
  customized?: boolean;
}

export interface Template {
  email?: notifyText;
  bot?: notifyText;
  sms?: notifyText;
  mail?: notifyText;
}

export const baseTemplate = {
  email: { subject: '', body: '' },
  bot: { subject: '', body: '' },
  sms: { subject: '', body: '' },
  mail: { subject: '', body: '' },
};

export interface notifyText {
  subject: string;
  body: string;
}

export interface RequestBodyProperties {
  type?: string;
  description?: string;
  format?: string;
}
export interface RequestBodySchema {
  schema: {
    properties: Record<string, RequestBodyProperties>;
  };
}

export interface NotificationMetrics {
  notificationsSent?: number;
  notificationsFailed?: number;
  sendDuration?: number;
}

export interface NotificationState {
  supportContact: ContactInformation;
  notificationTypes: Record<string, NotificationItem> | undefined;
  core: Record<string, NotificationItem>;
  metrics: NotificationMetrics;
}

export const NOTIFICATION_INIT: NotificationState = {
  supportContact: {},
  notificationTypes: undefined,
  core: {},
  metrics: {},
};
