import {
  AdspId,
  AuditAction,
  AuditCategories,
  AuditChangeSet,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

const ENTRY_RESOURCE_TYPE = 'entry';
const RESOURCE_RESOURCE_TYPE = 'resource';
const TAG_RESOURCE_TYPE = 'tag';
const NAMESPACE_RESOURCE_TYPE = 'namespace';

export const EntryCreatedAuditAction: AuditAction = {
  name: 'entry.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: ENTRY_RESOURCE_TYPE,
  description: 'A directory entry (service or API) is registered.',
};

export const EntryUpdatedAuditAction: AuditAction = {
  name: 'entry.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: ENTRY_RESOURCE_TYPE,
  captureChangeSet: true,
  description: 'The URL of a directory entry is modified.',
};

export const EntryDeletedAuditAction: AuditAction = {
  name: 'entry.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: ENTRY_RESOURCE_TYPE,
  description: 'A directory entry is removed.',
};

export const ResourceTagAddedAuditAction: AuditAction = {
  name: 'resource-tag.added',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: RESOURCE_RESOURCE_TYPE,
  description: 'A tag is applied to a resource.',
};

export const ResourceTagRemovedAuditAction: AuditAction = {
  name: 'resource-tag.removed',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: RESOURCE_RESOURCE_TYPE,
  description: 'A tag is removed from a resource.',
};

export const NamespaceCreatedAuditAction: AuditAction = {
  name: 'namespace.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: NAMESPACE_RESOURCE_TYPE,
  description: 'A directory namespace is created for a tenant.',
};

export const TagDeletedAuditAction: AuditAction = {
  name: 'tag.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: TAG_RESOURCE_TYPE,
  description: 'A tag is deleted.',
};

export const ResourceDeletedAuditAction: AuditAction = {
  name: 'resource.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: RESOURCE_RESOURCE_TYPE,
  description: 'A tagged resource record is deleted.',
};

export const DirectoryAuditActions: AuditAction[] = [
  NamespaceCreatedAuditAction,
  TagDeletedAuditAction,
  ResourceDeletedAuditAction,
  EntryCreatedAuditAction,
  EntryUpdatedAuditAction,
  EntryDeletedAuditAction,
  ResourceTagAddedAuditAction,
  ResourceTagRemovedAuditAction,
];

export interface DirectoryAuditDetails {
  resource: { type: string; id: string };
  metadata: Record<string, unknown>;
  changeSet?: AuditChangeSet;
}

/** URN of a directory entry; the api is omitted for a service entry. */
export const toEntryUrn = (namespace: string, service: string, api?: string): string =>
  `urn:ads:${namespace}:${service}${api ? `:${api}` : ''}`;

export const toEntryAuditDetails = (
  namespace: string,
  service: string,
  api?: string,
  extra?: { url?: string; changeSet?: AuditChangeSet },
): DirectoryAuditDetails => ({
  resource: { type: ENTRY_RESOURCE_TYPE, id: toEntryUrn(namespace, service, api) },
  metadata: { namespace, service, ...(api ? { api } : {}), ...(extra?.url ? { url: extra.url } : {}) },
  ...(extra?.changeSet ? { changeSet: extra.changeSet } : {}),
});

export const toNamespaceAuditDetails = (namespace: string): DirectoryAuditDetails => ({
  resource: { type: NAMESPACE_RESOURCE_TYPE, id: namespace },
  metadata: { namespace },
});

export const toTagDeletedAuditDetails = (tag: string): DirectoryAuditDetails => ({
  resource: { type: TAG_RESOURCE_TYPE, id: tag },
  metadata: { tag },
});

export const toResourceDeletedAuditDetails = (resourceUrn: string): DirectoryAuditDetails => ({
  resource: { type: RESOURCE_RESOURCE_TYPE, id: resourceUrn },
  metadata: {},
});

export const toTagAuditDetails = (
  resourceUrn: string,
  tag: { value: string; label?: string },
): DirectoryAuditDetails => ({
  resource: { type: RESOURCE_RESOURCE_TYPE, id: resourceUrn },
  metadata: { tag: tag.value, ...(tag.label ? { label: tag.label } : {}) },
});

/**
 * Records an audit event for a directory write, without blocking or failing the request.
 *
 * Events are recorded against the tenant that owns the namespace or resource. A failure to record is logged
 * at warn level and the directory operation is not rolled back.
 */
export function auditDirectory(
  auditService: AuditService,
  logger: Logger,
  action: AuditAction,
  user: User,
  tenantId: AdspId,
  { resource, metadata, changeSet }: DirectoryAuditDetails,
): void {
  const warn = (reason: unknown) =>
    logger.warn(`Failed to record audit event ${action.name} for ${resource.id}: ${reason}`, {
      context: 'directory-audit',
      tenant: tenantId?.toString(),
    });

  try {
    void auditService
      .record(action, {
        tenantId,
        actor: toAuditActor(user),
        resource,
        correlationId: resource.id,
        metadata,
        ...(changeSet ? { changeSet } : {}),
      })
      .then((outcome) => {
        if (outcome.status === 'rejected' && outcome.code === 'audit_disabled') {
          return;
        }

        if (outcome.status !== 'recorded') {
          warn(`not recorded (${outcome.status})`);
        }
      })
      .catch(warn);
  } catch (err) {
    warn(err);
  }
}
