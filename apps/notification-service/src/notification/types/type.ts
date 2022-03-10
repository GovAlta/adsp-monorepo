import { NotificationType as BaseNotificationType, NotificationTypeEvent } from '@abgov/adsp-service-sdk';

export type { NotificationTypeEvent, Template } from '@abgov/adsp-service-sdk';
export { Channel } from '@abgov/adsp-service-sdk';

export interface NotificationType extends Exclude<BaseNotificationType, 'displayName'> {
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
