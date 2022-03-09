export interface NotificationItem {
  name: string;
  description?: string;
  events: Array<EventItem>;
  subscriberRoles: string[];
  id: string;
  publicSubscribe: boolean;
  customized?: boolean;
  manageSubscribe?: boolean;
}

export interface ContactInformation {
  contactEmail?: string;
  phoneNumber?: string;
  supportInstructions?: string;
}

export type NotificationType = Record<string, ContactInformation & NotificationItem>;

export interface EventItem {
  name: string;
  namespace?: string;
  templates?: Template;
  channels?: string[];
  customized?: boolean;
}

export interface Template {
  email?: notifyText;
  sms?: notifyText;
}

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
}

export interface NotificationState {
  contactInfo: ContactInformation | undefined;
  core: NotificationType;
  metrics: NotificationMetrics;
}

export const NOTIFICATION_INIT: NotificationState = {
  contactInfo: undefined,
  core: {},
  metrics: {},
};
