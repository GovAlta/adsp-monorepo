export interface NotificationItem {
  name: string;
  description?: string;
  events: Array<EventItem>;
  subscriberRoles: string[];
  id: string;
  publicSubscribe: boolean;
  customized?: boolean;
}

export type NotificationType = Record<string, NotificationItem>;

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

export interface NotificationService {
  notificationList: NotificationType;
  notificationTypes: NotificationType | undefined;
  core: NotificationType;
}

export const NOTIFICATION_INIT: NotificationService = {
  notificationList: {},
  notificationTypes: undefined,
  core: {},
};
