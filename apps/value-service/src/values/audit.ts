import {
  AdspId,
  AuditAction,
  AuditCategories,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

const VALUE_DEFINITION_RESOURCE_TYPE = 'value-definition';
const SERVICE_METRIC_ROLLUP_RESOURCE_TYPE = 'service-metric-rollup';
const LOG_CONTEXT = 'value-audit';

export const ValueDefinitionCreatedAuditAction: AuditAction = {
  name: 'value-definition.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: VALUE_DEFINITION_RESOURCE_TYPE,
  description: 'A value definition is created.',
};

export const ValueDefinitionUpdatedAuditAction: AuditAction = {
  name: 'value-definition.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: VALUE_DEFINITION_RESOURCE_TYPE,
  description: 'A value definition schema or settings are updated.',
};

export const ValueDefinitionDeletedAuditAction: AuditAction = {
  name: 'value-definition.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: VALUE_DEFINITION_RESOURCE_TYPE,
  description: 'A value definition is deleted. Stored values are not deleted.',
};

export const ServiceMetricRollupTriggeredAuditAction: AuditAction = {
  name: 'value-definition.service-metric-rollup.triggered',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  resourceType: SERVICE_METRIC_ROLLUP_RESOURCE_TYPE,
  description: 'A service metric rollup is triggered manually through the API.',
};

export const ValueAuditActions: AuditAction[] = [
  ValueDefinitionCreatedAuditAction,
  ValueDefinitionUpdatedAuditAction,
  ValueDefinitionDeletedAuditAction,
  ServiceMetricRollupTriggeredAuditAction,
];

export interface ValueAuditDetails {
  resource: { type: string; id: string };
  metadata: Record<string, unknown>;
}

/** Audit details of a value definition; the resource id is `<namespace>:<name>`. */
export const toDefinitionAuditDetails = (
  namespace: string,
  name: string,
  metadata: Record<string, unknown> = {},
): ValueAuditDetails => ({
  resource: { type: VALUE_DEFINITION_RESOURCE_TYPE, id: `${namespace}:${name}` },
  metadata: { ...metadata, namespace, name },
});

/** Audit details of a manual service metric rollup over the inclusive range of days. */
export const toRollupAuditDetails = (
  range: { start: string; end: string },
  rollups: number,
  tenant?: string,
): ValueAuditDetails => ({
  resource: { type: SERVICE_METRIC_ROLLUP_RESOURCE_TYPE, id: `${range.start}/${range.end}` },
  metadata: { start: range.start, end: range.end, rollups, ...(tenant ? { tenant } : {}) },
});

/**
 * Records an audit event without blocking or failing the request.
 *
 * Events are recorded to a tenant. A core request without a tenant context has no tenant to record against, so it is
 * not audited.
 */
export function auditValue(
  auditService: AuditService,
  logger: Logger,
  action: AuditAction,
  user: User,
  tenantId: AdspId | undefined,
  { resource, metadata }: ValueAuditDetails,
): void {
  if (!tenantId) {
    return;
  }

  try {
    const details: AuditRecordDetails = {
      tenantId,
      actor: toAuditActor(user),
      resource,
      correlationId: resource.id,
      metadata,
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
