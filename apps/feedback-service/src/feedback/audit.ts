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
import { createHash } from 'crypto';
import { Logger } from 'winston';
import { Feedback } from './types';

const FEEDBACK_RESOURCE_TYPE = 'feedback';
const LOG_CONTEXT = 'feedback-audit';
const MAX_ERROR_LENGTH = 500;

export const FeedbackSubmittedAuditAction: AuditAction = {
  name: 'feedback.submitted',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: FEEDBACK_RESOURCE_TYPE,
  description: 'Feedback is submitted for a site.',
};

export const FeedbackAnonymizedAuditAction: AuditAction = {
  name: 'feedback.anonymized',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: FEEDBACK_RESOURCE_TYPE,
  description: 'Text of submitted feedback is anonymized and the feedback is stored.',
};

export const FeedbackAnonymizationFailedAuditAction: AuditAction = {
  name: 'feedback.anonymization-failed',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Security,
  resourceType: FEEDBACK_RESOURCE_TYPE,
  description: 'Anonymization of the text of submitted feedback fails and the feedback is not stored.',
};

export const FeedbackAuditActions: AuditAction[] = [
  FeedbackSubmittedAuditAction,
  FeedbackAnonymizedAuditAction,
  FeedbackAnonymizationFailedAuditAction,
];

/** Actor of feedback sent by users who are not signed in, to sites that allow anonymous feedback. */
export const AnonymousAuditActor: AuditActor = { id: 'anonymous', type: 'user', name: 'Anonymous' };

/** Actor of the job that anonymizes and stores queued feedback. */
export const FeedbackJobAuditActor: AuditActor = {
  id: 'feedback-service-job',
  type: 'system',
  name: 'Feedback service job',
};

export function toFeedbackAuditActor(user?: User): AuditActor {
  return user ? toAuditActor(user) : AnonymousAuditActor;
}

/**
 * Builds the details of an audit event about feedback. The comment and technical issue are free text that can contain
 * personal information, so only whether each was provided is recorded.
 */
export function toFeedbackAuditDetails(
  actor: AuditActor,
  tenantId: AdspId,
  feedbackId: string,
  { context, rating, comment, technicalIssue }: Feedback,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId,
    actor,
    resource: { type: FEEDBACK_RESOURCE_TYPE, id: feedbackId },
    correlationId: context.correlationId || undefined,
    metadata: {
      site: context.site,
      view: context.view,
      rating,
      commentProvided: !!comment,
      technicalIssueProvided: !!technicalIssue,
      ...metadata,
    },
  };
}

/**
 * Name-based UUID (RFC 9562 v8 from SHA-256) of the event for an action on a feedback item, so that a redelivered work
 * item does not record the same event twice.
 */
export function toFeedbackAuditEventId(action: AuditAction, feedbackId: string): string {
  const hash = createHash('sha256').update(`${action.name}|${feedbackId}`).digest('hex');
  const variant = ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16);
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    `8${hash.substring(13, 16)}`,
    `${variant}${hash.substring(18, 20)}`,
    hash.substring(20, 32),
  ].join('-');
}

/** Error description for audit metadata; the message of an error does not include the anonymized text. */
export function toAuditError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.substring(0, MAX_ERROR_LENGTH);
}

/**
 * Records an audit event without blocking or failing the operation. The SDK logs events that are not recorded;
 * details are built inside the guard, so an error creating them is logged instead of failing the operation.
 */
export function recordFeedbackAudit(
  auditService: AuditService,
  logger: Logger,
  action: AuditAction,
  getDetails: () => AuditRecordDetails,
): void {
  try {
    void auditService.record(action, getDetails());
  } catch (err) {
    logger.warn(`Failed to record audit event ${action.name}: ${err}`, { context: LOG_CONTEXT });
  }
}
