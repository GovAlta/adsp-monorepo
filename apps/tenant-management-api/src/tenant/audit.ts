import {
  AdspId,
  AuditAction,
  AuditActor,
  AuditCategories,
  AuditChangeSet,
  AuditEventStatus,
  AuditRecordOutcome,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  User,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

const TENANT_RESOURCE_TYPE = 'tenant';
const SERVICE_ACCOUNT_PREFIX = 'service-account-';
const LOG_CONTEXT = { context: 'TenantAudit' };

export const TenantCreatedAuditAction: AuditAction = {
  name: 'tenant.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: TENANT_RESOURCE_TYPE,
  description: 'A new tenant is provisioned.',
};

export const TenantDeletedAuditAction: AuditAction = {
  name: 'tenant.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Critical,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: TENANT_RESOURCE_TYPE,
  description: 'A tenant is permanently removed.',
};

export const TenantUpdatedAuditAction: AuditAction = {
  name: 'tenant.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: TENANT_RESOURCE_TYPE,
  captureChangeSet: true,
  description: 'Tenant metadata is updated.',
};

export const TenantAuditActions: AuditAction[] = [
  TenantCreatedAuditAction,
  TenantDeletedAuditAction,
  TenantUpdatedAuditAction,
];

export interface AuditedTenant {
  /** Tenant URN, e.g. urn:ads:platform:tenant-service:v2:/tenants/{id} */
  id: string;
  name: string;
  realm: string;
}

export interface TenantAuditDetails {
  status?: AuditEventStatus;
  metadata?: Record<string, unknown>;
  changeSet?: AuditChangeSet;
}

export interface TenantAuditor {
  /**
   * Records an audit event for a tenant operation. Never rejects; events that are not recorded are logged at warn
   * level so the originating operation is never rolled back because of auditing.
   */
  record(action: AuditAction, user: User, tenant: AuditedTenant, details?: TenantAuditDetails): Promise<void>;
}

export function toAuditActor(user: User): AuditActor {
  if (!user) {
    return { id: 'tenant-service', type: 'system' };
  }

  return {
    id: user.id,
    type: user.name?.startsWith(SERVICE_ACCOUNT_PREFIX) ? 'service' : 'user',
    name: user.name || undefined,
    email: user.email || undefined,
    roles: user.roles,
  };
}

export function createTenantAuditor(logger: Logger, auditService: AuditService): TenantAuditor {
  return {
    record: async (action, user, tenant, { status, metadata, changeSet } = {}) => {
      let outcome: AuditRecordOutcome;
      try {
        outcome = await auditService.record(action, {
          tenantId: AdspId.parse(tenant.id),
          status,
          actor: toAuditActor(user),
          resource: { type: TENANT_RESOURCE_TYPE, id: tenant.id, name: tenant.name },
          correlationId: tenant.id,
          metadata: { ...metadata, tenantName: tenant.name, realm: tenant.realm },
          changeSet,
        });
      } catch (err) {
        logger.warn(`Audit event ${action.name} for tenant ${tenant.id} was not recorded: ${err.message}`, LOG_CONTEXT);
        return;
      }

      if (outcome.status !== 'recorded') {
        const reason = outcome.status === 'rejected' ? `${outcome.code}: ${outcome.reason}` : outcome.error;
        logger.warn(
          `Audit event ${action.name} for tenant ${tenant.id} was ${outcome.status} (event ${outcome.eventId}). ${reason}`,
          LOG_CONTEXT,
        );
      }
    },
  };
}
