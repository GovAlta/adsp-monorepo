export interface NotificationTypeItem {
  name: string;
  description?: string;
  events: [];
  subscriberRoles: [];
  id: string;
}

export interface NotificationItem {
  id: string;
  name: string;
  description?: string;
  subscriberRoles: [];
  events: [];
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
  notificationTypes: Array<NotificationTypeItem>;
}

export const NOTIFICATION_INIT: NotificationService = {
  notificationList: [],
  notificationTypes: undefined,
};
