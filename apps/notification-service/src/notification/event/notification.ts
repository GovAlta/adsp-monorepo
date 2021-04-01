import { DomainEvent } from '@core-services/core-common';
import { Notification, NotificationType } from '../types';

interface NotificationEvent extends DomainEvent {
  namespace: 'notification';
  context: {
    space: string;
    type: string;
  };
}

export interface NotificationsGenerated extends NotificationEvent {
  name: 'notifications-generated';
  event: DomainEvent;
  type: NotificationType;
  count: number;
}

export interface NotificationSentEvent extends NotificationEvent {
  name: 'notification-sent';
  notification: Notification;
}

export const generatedNotifications = (
  event: DomainEvent,
  type: NotificationType,
  count: number
): NotificationsGenerated => ({
  namespace: 'notification',
  name: 'notifications-generated',
  timestamp: new Date(),
  context: {
    space: type.spaceId,
    type: type.id,
    ...(event.context || {}),
  },
  correlationId: event.correlationId,
  event,
  type,
  count,
});

export const sentNotification = (notification: Notification): NotificationSentEvent => ({
  namespace: 'notification',
  name: 'notification-sent',
  timestamp: new Date(),
  context: {
    space: '',
    type: '',
  },
  notification,
});
