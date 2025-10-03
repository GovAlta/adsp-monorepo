import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { DomainEvent as ProcessedEvent, Update } from '@core-services/core-common';
import type {
  Notification,
  NotificationType,
  NotificationWorkItem,
  Subscriber,
  SubscriberChannel,
  Subscription,
} from './types';

const type = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
  },
};

const subscriber = {
  type: ['object', 'null'],
  properties: {
    id: { type: 'string' },
    userId: { type: ['string', 'null'] },
    addressAs: { type: ['string', 'null'] },
    channels: {
      type: ['array', 'null'],
      items: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
          address: { type: ['string', 'null'] },
          verified: { type: ['boolean', 'null'] },
        },
      },
    },
  },
};

const subscription = {
  type: ['object', 'null'],
  properties: {
    criteria: {
      type: ['array', 'null'],
      items: {
        type: 'object',
        properties: {
          correlationId: { type: ['string', 'null'] },
          context: { type: ['object', 'null'] },
        },
      },
    },
  },
};

const NOTIFICATION_GENERATED = 'notifications-generated';
export const NotificationsGeneratedDefinition: DomainEventDefinition = {
  name: NOTIFICATION_GENERATED,
  description: 'Signalled when notifications are generated for an event',
  payloadSchema: {
    type: 'object',
    properties: {
      type,
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

const NOTIFICATION_GENERATION_FAILED = 'notification-generation-failed';
export const NotificationGenerationFailedDefinition: DomainEventDefinition = {
  name: NOTIFICATION_GENERATION_FAILED,
  description: 'Signalled when there is an error in generation of notifications for an event',
  payloadSchema: {
    type: 'object',
    properties: {
      type,
      event: {
        type: 'object',
        properties: {
          namespace: { type: 'string' },
          name: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      error: { type: 'string' },
    },
  },
};

const NOTIFICATION_SENT = 'notification-sent';
export const NotificationSentDefinition: DomainEventDefinition = {
  name: NOTIFICATION_SENT,
  description: 'Signalled when a notification has been sent.',
  payloadSchema: {
    type: 'object',
    properties: {
      type,
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
      subscriber,
    },
  },
  interval: {
    namespace: 'notification-service',
    name: NOTIFICATION_GENERATED,
    context: 'generationId',
    metric: ['notification-service', 'notification-send'],
  },
};

const NOTIFICATION_SEND_FAILED = 'notification-send-failed';
export const NotificationSendFailedDefinition: DomainEventDefinition = {
  name: NOTIFICATION_SEND_FAILED,
  description: 'Signalled when there is an error in sending of a notification.',
  payloadSchema: {
    type: 'object',
    properties: {
      type,
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
      subscriber,
      error: { type: 'string' },
    },
  },
  interval: {
    namespace: 'notification-service',
    name: NOTIFICATION_GENERATED,
    context: 'generationId',
    metric: ['notification-service', 'notification-send-failed'],
  },
};

const SUBSCRIBER_CREATED = 'subscriber-created';
export const SubscriberCreatedDefinition: DomainEventDefinition = {
  name: SUBSCRIBER_CREATED,
  description: 'Signalled when a subscriber is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      subscriber,
      createdBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

const SUBSCRIBER_DELETED = 'subscriber-deleted';
export const SubscriberDeletedDefinition: DomainEventDefinition = {
  name: SUBSCRIBER_DELETED,
  description: 'Signalled when a subscriber is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {
      subscriber,
      deletedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

const SUBSCRIBER_UPDATED = 'subscriber-updated';
export const SubscriberUpdatedDefinition: DomainEventDefinition = {
  name: SUBSCRIBER_UPDATED,
  description: 'Signalled when a subscriber is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      subscriber,
      update: {
        type: 'object',
        properties: {
          addressAs: { type: ['string', 'null'] },
          channels: { type: ['array', 'null'] },
        },
      },
      updatedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

const SUBSCRIPTION_SET = 'subscription-set';
export const SubscriptionSetDefinition: DomainEventDefinition = {
  name: SUBSCRIPTION_SET,
  description: 'Signalled when a subscription is created or updated.',
  payloadSchema: {
    properties: {
      type,
      subscriber,
      subscription,
      setBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

const SUBSCRIPTION_DELETED = 'subscription-deleted';
export const SubscriptionDeletedDefinition: DomainEventDefinition = {
  name: SUBSCRIPTION_DELETED,
  description: 'Signalled when a subscription is deleted.',
  payloadSchema: {
    properties: {
      type,
      subscriber,
      deletedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

function mapChannels(channels: SubscriberChannel[]) {
  return (
    channels?.map(({ channel, address, verified }) => ({
      channel,
      address,
      verified,
    })) || []
  );
}

function mapSubscriber(subscriber?: Partial<Subscriber>) {
  return subscriber
    ? {
        id: subscriber.id,
        userId: subscriber.userId,
        addressAs: subscriber.addressAs,
        channels: mapChannels(subscriber.channels),
      }
    : null;
}

export function mapNotification(notification: Omit<Notification, 'tenantId' | 'correlationId' | 'context'>) {
  return {
    type: notification.type,
    event: notification.event,
    channel: notification.channel,
    to: notification.to,
    message: notification.message,
    subscriber: mapSubscriber(notification.subscriber),
  };
}

export const notificationsGenerated = (
  generationId: string,
  { correlationId = null, tenantId, context = {}, namespace, name, timestamp }: ProcessedEvent,
  type: NotificationType,
  count: number
): DomainEvent => ({
  name: NOTIFICATION_GENERATED,
  timestamp: new Date(),
  correlationId: correlationId || generationId,
  tenantId,
  context: {
    ...context,
    generationId,
  },
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

export const notificationGenerationFailed = (
  generationId: string,
  { correlationId = null, tenantId, context = {}, namespace, name, timestamp }: ProcessedEvent,
  type: NotificationType,
  error: string
): DomainEvent => ({
  name: NOTIFICATION_GENERATION_FAILED,
  timestamp: new Date(),
  correlationId: correlationId || generationId,
  tenantId,
  context: {
    ...context,
    generationId,
  },
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
    error,
  },
});

export const notificationSent = ({
  generationId,
  correlationId = null,
  tenantId,
  context = {},
  ...notification
}: NotificationWorkItem): DomainEvent => ({
  name: NOTIFICATION_SENT,
  timestamp: new Date(),
  correlationId: correlationId || generationId,
  context: {
    ...context,
    generationId,
  },
  tenantId: AdspId.parse(tenantId),
  payload: mapNotification(notification),
});

export const notificationSendFailed = (
  { generationId, correlationId = null, tenantId, context = {}, ...notification }: NotificationWorkItem,
  error: string
): DomainEvent => ({
  name: NOTIFICATION_SEND_FAILED,
  timestamp: new Date(),
  correlationId: correlationId || generationId,
  context: {
    ...context,
    generationId,
  },
  tenantId: AdspId.parse(tenantId),
  payload: {
    ...mapNotification(notification),
    error,
  },
});

export const subscriberCreated = (subscriber: Subscriber, createdBy: User): DomainEvent => ({
  name: SUBSCRIBER_CREATED,
  timestamp: new Date(),
  correlationId: subscriber.id,
  tenantId: subscriber.tenantId,
  payload: {
    subscriber: mapSubscriber(subscriber),
    createdBy: {
      id: createdBy.id,
      name: createdBy.name,
    },
  },
});

export const subscriberUpdated = (
  subscriber: Subscriber,
  update: Update<Subscriber>,
  updatedBy: User
): DomainEvent => ({
  name: SUBSCRIBER_UPDATED,
  timestamp: new Date(),
  correlationId: subscriber.id,
  tenantId: subscriber.tenantId,
  payload: {
    subscriber: mapSubscriber(subscriber),
    update: {
      addressAs: update.addressAs,
      channels: mapChannels(update.channels),
    },
    createdBy: {
      id: updatedBy.id,
      name: updatedBy.name,
    },
  },
});

export const subscriberDeleted = (subscriber: Subscriber, deletedBy: User): DomainEvent => ({
  name: SUBSCRIBER_DELETED,
  timestamp: new Date(),
  correlationId: subscriber.id,
  tenantId: subscriber.tenantId,
  payload: {
    subscriber: mapSubscriber(subscriber),
    createdBy: {
      id: deletedBy.id,
      name: deletedBy.name,
    },
  },
});

export const subscriptionSet = (
  type: NotificationType,
  subscriber: Subscriber,
  subscription: Subscription,
  setBy: User
): DomainEvent => ({
  name: SUBSCRIPTION_SET,
  timestamp: new Date(),
  correlationId: subscriber.id,
  tenantId: subscription.tenantId,
  payload: {
    type: {
      id: type.id,
      name: type.name,
    },
    subscriber: mapSubscriber(subscriber),
    subscription: {
      criteria: subscription.criteria,
    },
    setBy: {
      id: setBy.id,
      name: setBy.name,
    },
  },
});

export const subscriptionDeleted = (type: NotificationType, subscriber: Subscriber, deletedBy: User): DomainEvent => ({
  name: SUBSCRIPTION_DELETED,
  timestamp: new Date(),
  correlationId: subscriber.id,
  tenantId: subscriber.tenantId,
  payload: {
    type: {
      id: type.id,
      name: type.name,
    },
    subscriber: mapSubscriber(subscriber),
    deletedBy: {
      id: deletedBy.id,
      name: deletedBy.name,
    },
  },
});
