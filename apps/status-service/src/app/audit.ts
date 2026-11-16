import {
  AdspId,
  AuditAction,
  AuditActor,
  AuditCategories,
  AuditChangeSet,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

const APPLICATION_RESOURCE_TYPE = 'application';
const NOTICE_RESOURCE_TYPE = 'notice';
const LOG_CONTEXT = 'status-audit';

export const ApplicationCreatedAuditAction: AuditAction = {
  name: 'application.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: APPLICATION_RESOURCE_TYPE,
  description: 'A new application is registered in the status service.',
};

export const ApplicationUpdatedAuditAction: AuditAction = {
  name: 'application.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: APPLICATION_RESOURCE_TYPE,
  description: 'Application metadata is changed.',
};

export const ApplicationDeletedAuditAction: AuditAction = {
  name: 'application.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: APPLICATION_RESOURCE_TYPE,
  description: 'An application is removed.',
};

export const ApplicationStatusChangedAuditAction: AuditAction = {
  name: 'application.status-changed',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: APPLICATION_RESOURCE_TYPE,
  captureChangeSet: true,
  description: "An application's public operational status is changed. The change set holds the previous and new status.",
};

export const NoticeCreatedAuditAction: AuditAction = {
  name: 'notice.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: NOTICE_RESOURCE_TYPE,
  description: 'A new service notice is posted.',
};

export const NoticeUpdatedAuditAction: AuditAction = {
  name: 'notice.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: NOTICE_RESOURCE_TYPE,
  description: 'An existing notice is modified.',
};

export const NoticeDeletedAuditAction: AuditAction = {
  name: 'notice.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: NOTICE_RESOURCE_TYPE,
  description: 'A notice is removed.',
};

export const HealthCheckConfiguredAuditAction: AuditAction = {
  name: 'health-check.configured',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: APPLICATION_RESOURCE_TYPE,
  description: 'An application health check URL is changed, or its monitoring is started or stopped.',
};

export const StatusAuditActions: AuditAction[] = [
  ApplicationCreatedAuditAction,
  ApplicationUpdatedAuditAction,
  ApplicationDeletedAuditAction,
  ApplicationStatusChangedAuditAction,
  NoticeCreatedAuditAction,
  NoticeUpdatedAuditAction,
  NoticeDeletedAuditAction,
  HealthCheckConfiguredAuditAction,
];

export interface StatusAuditDetails {
  resource: { type: string; id: string };
  metadata: Record<string, unknown>;
  changeSet?: AuditChangeSet;
}

/** Audit details of an application; the resource id is the application key. */
export const toApplicationAuditDetails = (
  appKey: string,
  name: string | undefined,
  metadata: Record<string, unknown> = {},
  changeSet?: AuditChangeSet,
): StatusAuditDetails => ({
  resource: { type: APPLICATION_RESOURCE_TYPE, id: appKey },
  metadata: { ...metadata, appKey, name },
  ...(changeSet ? { changeSet } : {}),
});

interface NoticeLike {
  id: string;
  message?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  mode?: string;
}

const toIso = (value?: Date | string) => (value ? new Date(value).toISOString() : undefined);

/** Audit details of a notice. Notices have no title, so the message is recorded. */
export const toNoticeAuditDetails = (notice: NoticeLike): StatusAuditDetails => ({
  resource: { type: NOTICE_RESOURCE_TYPE, id: notice.id },
  metadata: {
    message: notice.message,
    startDate: toIso(notice.startDate),
    endDate: toIso(notice.endDate),
    mode: notice.mode,
  },
});

/** The actor is the signed-in user, without the email address. */
export function toStatusAuditActor(user: User): AuditActor {
  const { id, type, name, roles } = toAuditActor(user);
  return { id, type, name, roles };
}

/**
 * Records an audit event without blocking or failing the request.
 *
 * Events are recorded to the tenant of the acting user. A user without a tenant has no tenant to record against, so
 * the action is not audited.
 */
export function auditStatus(
  auditService: AuditService,
  logger: Logger,
  action: AuditAction,
  user: User,
  { resource, metadata, changeSet }: StatusAuditDetails,
): void {
  const tenantId: AdspId | undefined = user?.tenantId;
  if (!tenantId) {
    return;
  }

  try {
    const details: AuditRecordDetails = {
      tenantId,
      actor: toStatusAuditActor(user),
      resource,
      correlationId: resource.id,
      metadata,
      changeSet,
    };

    void auditService.record(action, details).catch((err) => {
      logger.warn(`Failed to record audit event ${action.name} for ${resource.id}: ${err}`, {
        context: LOG_CONTEXT,
        tenant: tenantId.toString(),
      });
    });
  } catch (err) {
    logger.warn(`Failed to record audit event ${action.name} for ${resource.id}: ${err}`, {
      context: LOG_CONTEXT,
      tenant: tenantId.toString(),
    });
  }
}
