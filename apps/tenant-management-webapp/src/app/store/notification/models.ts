export interface NotificationItem {
  name: string;
  description?: string;
  events: Array<EventItem>;
  subscriberRoles: string[];
  id: string;
  publicSubscribe: boolean;
}

export interface EventItem {
  name: string;
  namespace?: string;
  templates?: Template;
  channels?: string[];
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
  notificationList: Array<NotificationItem>;
  notificationTypes: Array<NotificationItem>;
  core: Array<NotificationItem>;
}

export const NOTIFICATION_INIT: NotificationService = {
  notificationList: [],
  notificationTypes: undefined,
  core: [],
};
