import {
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
import { ConfigurationEntity } from './model';

const CONFIGURATION_RESOURCE_TYPE = 'configuration';
const CONFIGURATION_DEFINITION_RESOURCE_TYPE = 'configuration-definition';
// Configuration definitions are stored as keys of the platform:configuration-service configuration.
const DEFINITIONS_NAMESPACE = 'platform';
const DEFINITIONS_NAME = 'configuration-service';
// Audit service limit for each of the metadata and change set JSON fields.
const MAX_JSON_FIELD_BYTES = 16 * 1024;
// Namespace of the audit service; its writes are not audited to avoid audit-on-audit recursion.
const AUDIT_SERVICE_NAMESPACE = 'audit-service';

export const ConfigurationUpdatedAuditAction: AuditAction = {
  name: 'configuration.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: CONFIGURATION_RESOURCE_TYPE,
  captureChangeSet: true,
  description: 'A configuration document is updated or replaced.',
};

export const ConfigurationDeletedAuditAction: AuditAction = {
  name: 'configuration.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: CONFIGURATION_RESOURCE_TYPE,
  description: 'A configuration document is deleted.',
};

export const ConfigurationRevisionCreatedAuditAction: AuditAction = {
  name: 'configuration.revision-created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: CONFIGURATION_RESOURCE_TYPE,
  description: 'A new revision of a configuration document is created.',
};

export const ConfigurationActiveRevisionSetAuditAction: AuditAction = {
  name: 'configuration.active-revision-set',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: CONFIGURATION_RESOURCE_TYPE,
  description: 'The active revision of a configuration document is changed.',
};

export const ConfigurationDefinitionCreatedAuditAction: AuditAction = {
  name: 'configuration-definition.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: CONFIGURATION_DEFINITION_RESOURCE_TYPE,
  captureChangeSet: true,
  description: 'A configuration definition is created.',
};

export const ConfigurationDefinitionUpdatedAuditAction: AuditAction = {
  name: 'configuration-definition.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: CONFIGURATION_DEFINITION_RESOURCE_TYPE,
  captureChangeSet: true,
  description: 'A configuration definition is updated.',
};

export const ConfigurationDefinitionDeletedAuditAction: AuditAction = {
  name: 'configuration-definition.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: CONFIGURATION_DEFINITION_RESOURCE_TYPE,
  captureChangeSet: true,
  description: 'A configuration definition is deleted.',
};

export const ConfigurationAuditActions: AuditAction[] = [
  ConfigurationUpdatedAuditAction,
  ConfigurationDeletedAuditAction,
  ConfigurationRevisionCreatedAuditAction,
  ConfigurationActiveRevisionSetAuditAction,
  ConfigurationDefinitionCreatedAuditAction,
  ConfigurationDefinitionUpdatedAuditAction,
  ConfigurationDefinitionDeletedAuditAction,
];

export interface ConfigurationAuditDetails {
  /** Operation that was performed, e.g. the patch or post operation of the request. */
  operation?: string;
  /** Audited resource; defaults to the configuration document itself. */
  resource?: { type: string; id: string };
  metadata?: Record<string, unknown>;
  changeSet?: AuditChangeSet;
}

const jsonSize = (value: unknown) => Buffer.byteLength(JSON.stringify(value) ?? '');

/**
 * Records an audit event about a configuration document, without blocking or failing the request.
 *
 * Events are recorded to the tenant of the configuration. Core (platform) configuration has no tenant, which a
 * core service cannot record against, so it is not audited. Writes to the audit service namespace are skipped.
 */
export function auditConfiguration(
  auditService: AuditService,
  logger: Logger,
  action: AuditAction,
  user: User,
  { namespace, name, tenantId }: Pick<ConfigurationEntity, 'namespace' | 'name' | 'tenantId'>,
  { operation, resource, metadata, changeSet }: ConfigurationAuditDetails = {},
): void {
  if (!tenantId || namespace === AUDIT_SERVICE_NAMESPACE) {
    return;
  }

  try {
    const details: AuditRecordDetails = {
      tenantId,
      actor: toAuditActor(user),
      resource: resource ?? { type: CONFIGURATION_RESOURCE_TYPE, id: `${namespace}:${name}` },
      correlationId: `${namespace}:${name}`,
      metadata: { ...metadata, namespace, name, ...(operation ? { operation } : {}) },
    };

    if (changeSet) {
      // The audit service rejects a change set over the size limit, so drop it and flag the omission instead.
      if (jsonSize(changeSet) <= MAX_JSON_FIELD_BYTES) {
        details.changeSet = changeSet;
      } else {
        details.metadata.changeSetOmitted = true;
      }
    }

    void auditService
      .record(action, details)
      .then((outcome) => {
        if (outcome.status !== 'recorded') {
          logger.warn(`Audit event ${action.name} for ${namespace}:${name} was not recorded (${outcome.status}).`, {
            context: 'configuration-audit',
            tenant: tenantId.toString(),
            eventId: outcome.eventId,
          });
        }
      })
      .catch((err) => {
        logger.warn(`Failed to record audit event ${action.name} for ${namespace}:${name}: ${err}`, {
          context: 'configuration-audit',
          tenant: tenantId.toString(),
        });
      });
  } catch (err) {
    logger.warn(`Failed to record audit event ${action.name} for ${namespace}:${name}: ${err}`, {
      context: 'configuration-audit',
      tenant: tenantId.toString(),
    });
  }
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asRecordOrNull = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

/**
 * Records definition-level audit events when the platform:configuration-service configuration, which holds the
 * configuration definitions as keys, is changed. Each created, updated, or deleted definition is audited separately.
 */
export function auditConfigurationDefinitions(
  auditService: AuditService,
  logger: Logger,
  user: User,
  entity: Pick<ConfigurationEntity, 'namespace' | 'name' | 'tenantId'>,
  before: unknown,
  after: unknown,
  operation?: string,
): void {
  if (entity.namespace !== DEFINITIONS_NAMESPACE || entity.name !== DEFINITIONS_NAME) {
    return;
  }

  const previous = asRecord(before);
  const current = asRecord(after);
  for (const key of new Set([...Object.keys(previous), ...Object.keys(current)])) {
    const existed = key in previous;
    const exists = key in current;

    let action: AuditAction;
    if (!existed && exists) {
      action = ConfigurationDefinitionCreatedAuditAction;
    } else if (existed && !exists) {
      action = ConfigurationDefinitionDeletedAuditAction;
    } else if (!isDeepStrictEqual(previous[key], current[key])) {
      action = ConfigurationDefinitionUpdatedAuditAction;
    } else {
      continue;
    }

    auditConfiguration(auditService, logger, action, user, entity, {
      operation,
      resource: { type: CONFIGURATION_DEFINITION_RESOURCE_TYPE, id: key },
      changeSet: { before: asRecordOrNull(previous[key]), after: asRecordOrNull(current[key]) },
    });
  }
}
