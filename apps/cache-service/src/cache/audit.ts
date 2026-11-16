import {
  AdspId,
  AuditAction,
  AuditActor,
  AuditCategories,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
} from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';
import { Logger } from 'winston';

const CACHE_TARGET_RESOURCE_TYPE = 'cache-target';

// Invalidation is driven by domain events, so there is no request user to attribute it to.
const SYSTEM_ACTOR: AuditActor = { id: 'cache-service', type: 'system', name: 'Cache service' };

export const CacheInvalidatedAuditAction: AuditAction = {
  name: 'cache.invalidated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  // Overrides the compliance default of the administrative category; invalidation is routine and not a compliance record.
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: CACHE_TARGET_RESOURCE_TYPE,
  description: 'A cache entry or set of entries is invalidated in response to an event.',
};

export const CacheAuditActions: AuditAction[] = [CacheInvalidatedAuditAction];

interface CacheInvalidatedDetails {
  tenantId: AdspId;
  targetId: AdspId;
  ttl: number;
  event: Pick<DomainEvent, 'namespace' | 'name' | 'correlationId'>;
  paths: string[];
}

/**
 * Records that cache entries were removed. Never throws; failures are logged.
 * Only call when entries were actually removed; cache hits and misses are not audited.
 */
export function auditCacheInvalidated(
  auditService: AuditService,
  logger: Logger,
  { tenantId, targetId, ttl, event, paths }: CacheInvalidatedDetails
): void {
  // A core service can't record audit events without a tenant.
  if (!auditService || !tenantId) {
    return;
  }

  const logContext = { context: 'CacheAudit', tenant: tenantId.toString() };
  try {
    void auditService
      .record(CacheInvalidatedAuditAction, {
        tenantId,
        actor: SYSTEM_ACTOR,
        resource: { type: CACHE_TARGET_RESOURCE_TYPE, id: targetId.toString() },
        correlationId: event.correlationId,
        metadata: {
          targetUrn: targetId.toString(),
          ttl,
          event: `${event.namespace}:${event.name}`,
          paths,
        },
      })
      .then((outcome) => {
        if (outcome.status === 'rejected' && outcome.code === 'audit_disabled') {
          return;
        }
        if (outcome.status !== 'recorded') {
          logger.warn(`Audit event ${CacheInvalidatedAuditAction.name} was not recorded (${outcome.status}).`, logContext);
        }
      })
      .catch((err) => {
        logger.warn(`Failed to record audit event ${CacheInvalidatedAuditAction.name}: ${err}`, logContext);
      });
  } catch (err) {
    logger.warn(`Failed to record audit event ${CacheInvalidatedAuditAction.name}: ${err}`, logContext);
  }
}
