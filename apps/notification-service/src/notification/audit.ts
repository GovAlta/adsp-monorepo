import {
  AdspId,
  AuditAction,
  AuditActor,
  AuditCategories,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import type { Notification, Subscriber } from './types';

const SUBSCRIBER_RESOURCE_TYPE = 'subscriber';
const SUBSCRIPTION_RESOURCE_TYPE = 'subscription';
const NOTIFICATION_TYPE_RESOURCE_TYPE = 'notification-type';
const LOG_CONTEXT = 'notification-audit';

export const SubscriberCreatedAuditAction: AuditAction = {
  name: 'subscriber.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: SUBSCRIBER_RESOURCE_TYPE,
  description: 'A subscriber is created.',
};

export const SubscriberUpdatedAuditAction: AuditAction = {
  name: 'subscriber.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: SUBSCRIBER_RESOURCE_TYPE,
  description: 'The name or channels of a subscriber are changed, or a subscriber channel is verified.',
};

export const SubscriberDeletedAuditAction: AuditAction = {
  name: 'subscriber.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: SUBSCRIBER_RESOURCE_TYPE,
  description: 'A subscriber and its subscriptions are deleted.',
};

export const SubscriptionCreatedAuditAction: AuditAction = {
  name: 'subscription.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: SUBSCRIPTION_RESOURCE_TYPE,
  description: 'A subscriber is subscribed to a notification type.',
};

export const SubscriptionUpdatedAuditAction: AuditAction = {
  name: 'subscription.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: SUBSCRIPTION_RESOURCE_TYPE,
  description: 'The criteria of a subscription are changed.',
};

export const SubscriptionDeletedAuditAction: AuditAction = {
  name: 'subscription.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: SUBSCRIPTION_RESOURCE_TYPE,
  description: 'A subscriber is unsubscribed from a notification type.',
};

export const NotificationSentAuditAction: AuditAction = {
  name: 'notification.sent',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  resourceType: SUBSCRIPTION_RESOURCE_TYPE,
  description: 'A notification is sent to a subscriber through a channel provider.',
};

export const NotificationFailedAuditAction: AuditAction = {
  name: 'notification.send-failed',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Warning,
  resourceType: SUBSCRIPTION_RESOURCE_TYPE,
  description: 'A notification to a subscriber could not be sent after all retries.',
};

export const NotificationDirectSentAuditAction: AuditAction = {
  name: 'notification.direct-sent',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  resourceType: NOTIFICATION_TYPE_RESOURCE_TYPE,
  description: 'A notification of a direct type is sent to the address in the event through a channel provider.',
};

export const NotificationDirectSendFailedAuditAction: AuditAction = {
  name: 'notification.direct-send-failed',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Warning,
  resourceType: NOTIFICATION_TYPE_RESOURCE_TYPE,
  description: 'A notification of a direct type could not be sent after all retries.',
};

export const NotificationTypeCreatedAuditAction: AuditAction = {
  name: 'notification-type.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: NOTIFICATION_TYPE_RESOURCE_TYPE,
  description: 'A tenant notification type is created.',
};

export const NotificationTypeUpdatedAuditAction: AuditAction = {
  name: 'notification-type.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: NOTIFICATION_TYPE_RESOURCE_TYPE,
  description: 'A tenant notification type is changed, or a platform notification type is customized.',
};

export const NotificationTypeDeletedAuditAction: AuditAction = {
  name: 'notification-type.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: NOTIFICATION_TYPE_RESOURCE_TYPE,
  description: 'A tenant notification type, or the tenant customization of a platform type, is deleted.',
};

export const NotificationAuditActions: AuditAction[] = [
  SubscriberCreatedAuditAction,
  SubscriberUpdatedAuditAction,
  SubscriberDeletedAuditAction,
  SubscriptionCreatedAuditAction,
  SubscriptionUpdatedAuditAction,
  SubscriptionDeletedAuditAction,
  NotificationSentAuditAction,
  NotificationFailedAuditAction,
  NotificationDirectSentAuditAction,
  NotificationDirectSendFailedAuditAction,
  NotificationTypeCreatedAuditAction,
  NotificationTypeUpdatedAuditAction,
  NotificationTypeDeletedAuditAction,
];

/** Actor of notifications sent by the service in response to domain events. */
export const NotificationJobAuditActor: AuditActor = {
  id: 'notification-service-job',
  type: 'system',
  name: 'Notification service job',
};

/** The actor is the user or service account, without the email address. */
export function toNotificationAuditActor(user: User): AuditActor {
  const { id, type, name, roles } = toAuditActor(user);
  return { id, type, name, roles };
}

/** Audit details of a subscriber. Channel addresses are personal information, so only channel types are recorded. */
export function toSubscriberAuditDetails(
  tenantId: AdspId,
  user: User,
  subscriber: Pick<Subscriber, 'id' | 'userId' | 'channels'>,
): AuditRecordDetails {
  return {
    tenantId,
    actor: toNotificationAuditActor(user),
    resource: { type: SUBSCRIBER_RESOURCE_TYPE, id: subscriber.id },
    metadata: {
      userId: subscriber.userId ?? null,
      channels: (subscriber.channels ?? []).map(({ channel, verified }) => ({ channel, verified: !!verified })),
    },
  };
}

/** Audit details of a subscription; the resource ID is the notification type ID and subscriber ID. */
export function toSubscriptionAuditDetails(
  tenantId: AdspId,
  user: User,
  typeId: string,
  subscriberId: string,
): AuditRecordDetails {
  return {
    tenantId,
    actor: toNotificationAuditActor(user),
    resource: { type: SUBSCRIPTION_RESOURCE_TYPE, id: `${typeId}:${subscriberId}` },
    metadata: { typeId, subscriberId },
  };
}

/** Audit details of a notification type configured by a tenant. */
export function toNotificationTypeAuditDetails(
  tenantId: AdspId,
  user: User,
  type: { id: string; name?: string; channels?: string[] },
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId,
    actor: toNotificationAuditActor(user),
    resource: { type: NOTIFICATION_TYPE_RESOURCE_TYPE, id: type.id, name: type.name },
    metadata: { typeId: type.id, channels: type.channels ?? [], ...metadata },
  };
}

/**
 * Audit details of a sent or failed notification. The resource is the subscription when there is a subscriber, and
 * otherwise the notification type. The recipient address and message content are never recorded.
 */
export function toNotificationAuditDetails(
  notification: Notification,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  const { tenantId, type, event, channel, subscriber, correlationId, context } = notification;
  return {
    tenantId: AdspId.isAdspId(tenantId) ? AdspId.parse(tenantId) : undefined,
    actor: NotificationJobAuditActor,
    resource: subscriber?.id
      ? { type: SUBSCRIPTION_RESOURCE_TYPE, id: `${type.id}:${subscriber.id}` }
      : { type: NOTIFICATION_TYPE_RESOURCE_TYPE, id: type.id, name: type.name },
    correlationId: correlationId || undefined,
    metadata: {
      typeId: type.id,
      channel,
      event: event ? `${event.namespace}:${event.name}` : undefined,
      subscriberId: subscriber?.id ?? null,
      context: context ?? null,
      ...metadata,
    },
  };
}

/**
 * Sent and failed actions of a notification. Audit service rejects a record whose resource type differs from the
 * action resource type, so the action follows the same subscriber check as the resource in toNotificationAuditDetails.
 */
export function getNotificationAuditActions(notification: Pick<Notification, 'subscriber'>): {
  sent: AuditAction;
  failed: AuditAction;
} {
  return notification.subscriber?.id
    ? { sent: NotificationSentAuditAction, failed: NotificationFailedAuditAction }
    : { sent: NotificationDirectSentAuditAction, failed: NotificationDirectSendFailedAuditAction };
}

export type NotificationAuditor = (action: AuditAction, details: AuditRecordDetails) => void;

/**
 * Creates a function that records an audit event without blocking or failing the operation. An event without a
 * tenant has no tenant to record against, so the action is not audited.
 */
export function createNotificationAuditor(auditService: AuditService, logger: Logger): NotificationAuditor {
  return (action, details) => {
    const tenantId = details?.tenantId;
    if (!tenantId) {
      return;
    }

    const warn = (err: unknown) =>
      logger.warn(`Failed to record audit event ${action.name} for ${details.resource?.id}: ${err}`, {
        context: LOG_CONTEXT,
        tenant: tenantId.toString(),
      });

    try {
      void auditService.record(action, details).catch(warn);
    } catch (err) {
      warn(err);
    }
  };
}
