export interface NotificationItem {
  id: string;
  name: string;
  description?: string;
  subscriberRoles: [];
  events: [];
  publicSubscribe: boolean;
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
}

export const NOTIFICATION_INIT: NotificationService = {
  notificationList: [],
  notificationTypes: [],
};
