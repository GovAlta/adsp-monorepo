import {
  AdspId,
  AuditAction,
  AuditCategories,
  AuditChangeSet,
  AuditEventStatus,
  AuditRecordDetails,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';

const TENANT_RESOURCE_TYPE = 'tenant';

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

/**
 * Builds the details of an audit event about a tenant. Events are recorded to the affected tenant, with the tenant as
 * the resource and its name and realm in the metadata.
 */
export function toTenantAuditDetails(
  user: User,
  tenant: AuditedTenant,
  { status, metadata, changeSet }: TenantAuditDetails = {},
): AuditRecordDetails {
  return {
    tenantId: AdspId.parse(tenant.id),
    status,
    actor: toAuditActor(user),
    resource: { type: TENANT_RESOURCE_TYPE, id: tenant.id, name: tenant.name },
    correlationId: tenant.id,
    metadata: { ...metadata, tenantName: tenant.name, realm: tenant.realm },
    changeSet,
  };
}
