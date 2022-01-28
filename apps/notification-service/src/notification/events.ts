import { AdspId, DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';
import { DomainEvent as ProcessedEvent } from '@core-services/core-common';
import type { Notification, NotificationType } from './types';

export const NotificationsGeneratedDefinition: DomainEventDefinition = {
  name: 'notifications-generated',
  description: 'Signalled when notifications are generated for an event',
  payloadSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      event: {
        type: 'object',
        properties: {
          namespace: { type: 'string' },
          name: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      generatedCount: {
        type: 'integer',
      },
    },
  },
};

export const NotificationSentDefinition: DomainEventDefinition = {
  name: 'notification-sent',
  description: 'Signalled when a notification has been sent.',
  payloadSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      event: {
        type: 'object',
        properties: {
          namespace: { type: 'string' },
          name: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      channel: { type: 'string' },
      to: { type: 'string' },
      message: {
        type: 'object',
        properties: {
          subject: { type: ['string', 'null'] },
          body: { type: ['string', 'null'] },
        },
      },
      subscriber: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: ['string', 'null'] },
          addressAs: { type: ['string', 'null'] },
        },
      },
    },
  },
};

export const NotificationSendFailedDefinition: DomainEventDefinition = {
  name: 'notification-send-failed',
  description: 'Signalled when there is an error in sending of a notification.',
  payloadSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      event: {
        type: 'object',
        properties: {
          namespace: { type: 'string' },
          name: { type: 'string' },
        },
      },
      channel: { type: 'string' },
      to: { type: 'string' },
      message: {
        type: 'object',
        properties: {
          subject: { type: ['string', 'null'] },
          body: { type: ['string', 'null'] },
        },
      },
      subscriber: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: ['string', 'null'] },
          addressAs: { type: ['string', 'null'] },
        },
      },
      error: { type: 'string' },
    },
  },
};

function mapNotification(notification: Omit<Notification, 'tenantId' | 'correlationId' | 'context'>) {
  return {
    type: notification.type,
    event: notification.event,
    channel: notification.channel,
    to: notification.to,
    message: notification.message,
    subscriber: notification.subscriber,
  };
}

export const notificationsGenerated = (
  { correlationId = null, tenantId, context = {}, namespace, name, timestamp }: ProcessedEvent,
  type: NotificationType,
  count: number
): DomainEvent => ({
  name: 'notifications-generated',
  timestamp: new Date(),
  correlationId,
  tenantId,
  context,
  payload: {
    type: {
      id: type.id,
      name: type.name,
    },
    event: {
      namespace,
      name,
      timestamp,
    },
    generatedCount: count,
  },
});

export const notificationSent = ({
  correlationId = null,
  tenantId,
  context = {},
  ...notification
}: Notification): DomainEvent => ({
  name: 'notification-sent',
  timestamp: new Date(),
  correlationId,
  context,
  tenantId: AdspId.parse(tenantId),
  payload: mapNotification(notification),
});

export const notificationSendFailed = (
  { correlationId = null, tenantId, context = {}, ...notification }: Notification,
  error: string
): DomainEvent => ({
  name: 'notification-send-failed',
  timestamp: new Date(),
  correlationId,
  context,
  tenantId: AdspId.parse(tenantId),
  payload: {
    ...mapNotification(notification),
    error,
  },
});
