import { Channel } from './channel';
import { Template } from './template';

export interface NotificationTypeEvent {
  namespace: string;
  name: string;
  templates: Partial<Record<Channel, Template>>;
  channels: Channel[];
}

export interface NotificationType {
  id: string;
  name: string;
  description: string;
  subscriberRoles: string[];
  events: NotificationTypeEvent[];
}

export interface NotificationTypeCriteria {
  tenantIdEquals?: string;
  eventCriteria?: {
    namespace?: string;
    name?: string;
  };
}
