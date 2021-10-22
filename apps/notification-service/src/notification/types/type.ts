import {
  Channel,
  NotificationType as BaseNotificationType,
  NotificationTypeEvent as BaseNotificationTypeEvent,
} from '@abgov/adsp-service-sdk';

export type { Template } from '@abgov/adsp-service-sdk';
export { Channel } from '@abgov/adsp-service-sdk';

export interface NotificationTypeEvent extends BaseNotificationTypeEvent {
  channels: Channel[];
}

export interface NotificationType extends BaseNotificationType {
  id: string;
  events: NotificationTypeEvent[];
}

export interface NotificationTypeCriteria {
  tenantIdEquals?: string;
  eventCriteria?: {
    namespace?: string;
    name?: string;
  };
}
