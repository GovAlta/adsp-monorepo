import {
  AdspId,
  AuditAction,
  AuditCategories,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { isDeepStrictEqual } from 'util';
import type { Logger } from 'winston';
import type { EventDefinition } from './types';

export const EVENT_DEFINITION_RESOURCE_TYPE = 'event-definition';

export const EventDefinitionCreatedAuditAction: AuditAction = {
  name: 'event-definition.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: EVENT_DEFINITION_RESOURCE_TYPE,
  description: 'An event definition is created, including its namespace if it is new.',
};

export const EventDefinitionUpdatedAuditAction: AuditAction = {
  name: 'event-definition.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: EVENT_DEFINITION_RESOURCE_TYPE,
  description: 'The description or payload schema of an event definition is updated.',
};

export const EventDefinitionDeletedAuditAction: AuditAction = {
  name: 'event-definition.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: EVENT_DEFINITION_RESOURCE_TYPE,
  description: 'An event definition is deleted, including its namespace if no definitions remain.',
};

export const EventServiceAuditActions: AuditAction[] = [
  EventDefinitionCreatedAuditAction,
  EventDefinitionUpdatedAuditAction,
  EventDefinitionDeletedAuditAction,
];

/**
 * Builds the details of an audit event about a tenant event definition, identified as `<namespace>:<name>`.
 */
export function toEventDefinitionAuditDetails(
  user: User,
  tenantId: AdspId,
  namespace: string,
  name: string,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId,
    actor: toAuditActor(user),
    resource: { type: EVENT_DEFINITION_RESOURCE_TYPE, id: `${namespace}:${name}` },
    metadata: { ...metadata, namespace, name },
  };
}

/** Returns the sorted names of definition properties that differ, ignoring the definition name. */
export function getChangedFields(before: EventDefinition, after: EventDefinition): string[] {
  const fields = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  fields.delete('name');
  return [...fields].filter((field) => !isDeepStrictEqual(before?.[field], after?.[field])).sort();
}

export interface EventDefinitionAuditRecorder {
  (
    action: AuditAction,
    user: User,
    tenantId: AdspId,
    namespace: string,
    name: string,
    metadata?: Record<string, unknown>,
  ): void;
}

/**
 * Creates a recorder of event definition audit events. Recording neither blocks nor fails the definition change;
 * the SDK logs events that are not recorded, and errors building the event are logged here.
 */
export function createEventDefinitionAuditRecorder(
  auditService: AuditService,
  logger: Logger,
): EventDefinitionAuditRecorder {
  return (action, user, tenantId, namespace, name, metadata) => {
    try {
      void auditService.record(action, toEventDefinitionAuditDetails(user, tenantId, namespace, name, metadata));
    } catch (err) {
      logger.warn(`Failed to record audit event ${action.name} for ${namespace}:${name}: ${err}`, {
        context: 'EventDefinitionAudit',
        tenant: tenantId?.toString(),
      });
    }
  };
}
