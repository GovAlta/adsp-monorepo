import {
  AdspId,
  AuditAction,
  AuditCategories,
  AuditChangeSet,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { isDeepStrictEqual } from 'util';
import { Logger } from 'winston';
import type { Comment, Topic, TopicType } from './types';

const TOPIC_RESOURCE_TYPE = 'topic';
const COMMENT_RESOURCE_TYPE = 'comment';
const TOPIC_TYPE_RESOURCE_TYPE = 'topic-type';
const LOG_CONTEXT = 'comment-audit';
// Audit service limit for each of the metadata and change set JSON fields.
const MAX_JSON_FIELD_BYTES = 16 * 1024;

export const TopicCreatedAuditAction: AuditAction = {
  name: 'topic.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: TOPIC_RESOURCE_TYPE,
  description: 'A topic is created.',
};

export const TopicUpdatedAuditAction: AuditAction = {
  name: 'topic.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: TOPIC_RESOURCE_TYPE,
  captureChangeSet: true,
  description: 'The name, description, or commenters of a topic are changed.',
};

export const TopicDeletedAuditAction: AuditAction = {
  name: 'topic.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: TOPIC_RESOURCE_TYPE,
  description: 'A topic and its comments are deleted.',
};

export const CommentCreatedAuditAction: AuditAction = {
  name: 'comment.created',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: COMMENT_RESOURCE_TYPE,
  description: 'A comment is posted to a topic.',
};

export const CommentUpdatedAuditAction: AuditAction = {
  name: 'comment.updated',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: COMMENT_RESOURCE_TYPE,
  description: 'A comment is edited.',
};

export const CommentDeletedAuditAction: AuditAction = {
  name: 'comment.deleted',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: COMMENT_RESOURCE_TYPE,
  description: 'A comment is deleted.',
};

export const TopicTypeCreatedAuditAction: AuditAction = {
  name: 'topic-type.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: TOPIC_TYPE_RESOURCE_TYPE,
  description: 'A topic type is created through the comment service API.',
};

export const TopicTypeUpdatedAuditAction: AuditAction = {
  name: 'topic-type.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: TOPIC_TYPE_RESOURCE_TYPE,
  captureChangeSet: true,
  description:
    'The name, roles, or security classification of a topic type are changed through the comment service API.',
};

export const TopicTypeDeletedAuditAction: AuditAction = {
  name: 'topic-type.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: TOPIC_TYPE_RESOURCE_TYPE,
  description: 'A topic type is deleted through the comment service API.',
};

export const CommentAuditActions: AuditAction[] = [
  TopicCreatedAuditAction,
  TopicUpdatedAuditAction,
  TopicDeletedAuditAction,
  CommentCreatedAuditAction,
  CommentUpdatedAuditAction,
  CommentDeletedAuditAction,
  TopicTypeCreatedAuditAction,
  TopicTypeUpdatedAuditAction,
  TopicTypeDeletedAuditAction,
];

type AuditedTopic = Pick<Topic, 'tenantId' | 'id' | 'name' | 'resourceId'> & { type?: Pick<TopicType, 'id'> };
type AuditedTopicType = Pick<TopicType, 'id' | 'name'>;

/**
 * Audit details of a topic. The resource ID of the topic links it to the domain entity being discussed, so it is
 * recorded as the correlation ID and in the metadata.
 */
export function toTopicAuditDetails(
  user: User,
  topic: AuditedTopic,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  const resourceId = topic.resourceId?.toString() || undefined;
  return {
    tenantId: topic.tenantId,
    actor: toAuditActor(user),
    resource: { type: TOPIC_RESOURCE_TYPE, id: `${topic.id}`, name: topic.name },
    correlationId: resourceId,
    metadata: { topicId: topic.id, typeId: topic.type?.id ?? null, resourceId: resourceId ?? null, ...metadata },
  };
}

/** Audit details of a comment. Comment title, content, and context are user generated, so they are never recorded. */
export function toCommentAuditDetails(
  user: User,
  topic: AuditedTopic,
  comment: Pick<Comment, 'id'>,
  commentAction: 'created' | 'updated' | 'deleted',
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  const { tenantId, actor, correlationId, metadata: topicMetadata } = toTopicAuditDetails(user, topic);
  return {
    tenantId,
    actor,
    resource: { type: COMMENT_RESOURCE_TYPE, id: `${comment.id}` },
    correlationId,
    metadata: { ...topicMetadata, commentAction, ...metadata },
  };
}

/** Audit details of a topic type configured through the comment service API. */
export function toTopicTypeAuditDetails(
  tenantId: AdspId,
  user: User,
  type: AuditedTopicType,
  metadata: Record<string, unknown> = {},
  changeSet?: AuditChangeSet,
): AuditRecordDetails {
  return {
    tenantId,
    actor: toAuditActor(user),
    resource: { type: TOPIC_TYPE_RESOURCE_TYPE, id: type.id, name: type.name },
    metadata: { typeId: type.id, ...metadata },
    ...(changeSet ? { changeSet } : {}),
  };
}

/** Keeps a change set within the audit service size limit, or drops it and flags the omission in the metadata. */
function withChangeSet(details: AuditRecordDetails, changeSet: AuditChangeSet): AuditRecordDetails {
  if (Buffer.byteLength(JSON.stringify(changeSet)) <= MAX_JSON_FIELD_BYTES) {
    return { ...details, changeSet };
  }
  return { ...details, metadata: { ...details.metadata, changeSetOmitted: true } };
}

const changedFields = (before: Record<string, unknown>, after: Record<string, unknown>) =>
  Object.keys(after).filter((key) => !isDeepStrictEqual(before[key], after[key]));

const pickFields = (values: Record<string, unknown>, fields: string[]) =>
  Object.fromEntries(fields.map((field) => [field, values[field]]));

type TopicUpdateFields = Pick<Topic, 'name' | 'description' | 'commenters'>;

/**
 * Audit details of a topic update. The change set holds the changed name and commenter user IDs; the description is
 * free text, so a change to it is only listed in the updated fields.
 */
export function toTopicUpdatedAuditDetails(
  user: User,
  topic: AuditedTopic & TopicUpdateFields,
  previous: TopicUpdateFields,
): AuditRecordDetails {
  const toFields = ({ name, description, commenters }: TopicUpdateFields) => ({
    name,
    description,
    commenters: commenters ?? [],
  });
  const before = toFields(previous);
  const after = toFields(topic);
  const updatedFields = changedFields(before, after);
  const changeSetFields = updatedFields.filter((field) => field !== 'description');

  const details = toTopicAuditDetails(user, topic, { updatedFields });
  return changeSetFields.length > 0
    ? withChangeSet(details, { before: pickFields(before, changeSetFields), after: pickFields(after, changeSetFields) })
    : details;
}

type TopicTypeFields = Pick<
  TopicType,
  'id' | 'name' | 'adminRoles' | 'readerRoles' | 'commenterRoles' | 'securityClassification'
>;

/** Audit details of a topic type update, with the type before and after the update as the change set. */
export function toTopicTypeUpdatedAuditDetails(
  tenantId: AdspId,
  user: User,
  previous: TopicTypeFields,
  updated: TopicTypeFields,
): AuditRecordDetails {
  const toFields = ({ name, adminRoles, readerRoles, commenterRoles, securityClassification }: TopicTypeFields) => ({
    name,
    adminRoles: adminRoles ?? [],
    readerRoles: readerRoles ?? [],
    commenterRoles: commenterRoles ?? [],
    securityClassification: securityClassification ?? null,
  });
  const before = toFields(previous);
  const after = toFields(updated);
  const updatedFields = changedFields(before, after);

  return withChangeSet(
    toTopicTypeAuditDetails(tenantId, user, updated, {
      updatedFields,
      rolesChanged: updatedFields.some((field) => field.endsWith('Roles')),
    }),
    { before, after },
  );
}

/**
 * Records an audit event without blocking or failing the operation. Details are built inside the guard, so an
 * error creating them is logged instead of failing a request that has already been responded to.
 */
export function recordCommentAudit(
  auditService: AuditService,
  logger: Logger,
  action: AuditAction,
  getDetails: () => AuditRecordDetails,
): void {
  const warn = (message: string, meta: Record<string, unknown> = {}) =>
    logger.warn(message, { context: LOG_CONTEXT, ...meta });

  try {
    const details = getDetails();
    if (!details.tenantId) {
      return;
    }

    const tenant = details.tenantId.toString();
    void auditService
      .record(action, details)
      .then((outcome) => {
        if (outcome.status === 'recorded' || (outcome.status === 'rejected' && outcome.code === 'audit_disabled')) {
          return;
        }
        warn(`Audit event ${action.name} for ${details.resource?.id} was not recorded (${outcome.status}).`, {
          tenant,
          eventId: outcome.eventId,
        });
      })
      .catch((err) =>
        warn(`Failed to record audit event ${action.name} for ${details.resource?.id}: ${err}`, { tenant }),
      );
  } catch (err) {
    warn(`Failed to record audit event ${action.name}: ${err}`);
  }
}
