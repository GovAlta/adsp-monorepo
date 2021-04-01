import { UserRole } from '@core-services/core-common';
import { Channel } from './channel';
import { Template } from './template';

export interface EventNotificationType {
  namespace: string;
  name: string;
  templates: {
    [Channel.email]: Template;
    [Channel.mail]: Template;
    [Channel.sms]: Template;
  };
  channels: Channel[];
}

export interface NotificationType {
  spaceId: string;
  id: string;
  name: string;
  description: string;
  publicSubscribe: boolean;
  subscriberRoles: UserRole[];
  events: EventNotificationType[];
}

export interface NotificationTypeCriteria {
  spaceIdEquals?: string;
  eventCriteria?: {
    namespace?: string;
    name?: string;
  };
}
