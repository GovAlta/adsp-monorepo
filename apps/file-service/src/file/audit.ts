import {
  AuditAction,
  AuditActor,
  AuditCategories,
  AuditRecordDetails,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import type { FileEntity } from './model';

const FILE_RESOURCE_TYPE = 'file';

export const FileUploadedAuditAction: AuditAction = {
  name: 'file.uploaded',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FILE_RESOURCE_TYPE,
  description: 'A file is uploaded, or created as a copy of another file.',
};

export const FileDownloadedAuditAction: AuditAction = {
  name: 'file.downloaded',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FILE_RESOURCE_TYPE,
  description: 'A scanned file is downloaded.',
};

export const FileUnsafeDownloadedAuditAction: AuditAction = {
  name: 'file.unsafe-downloaded',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Security,
  resourceType: FILE_RESOURCE_TYPE,
  description: 'A file is downloaded with unsafe=true before its virus scan is completed.',
};

export const FileDeletedAuditAction: AuditAction = {
  name: 'file.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FILE_RESOURCE_TYPE,
  description: 'A file is deleted and can no longer be accessed; its content is then removed from storage.',
};

export const FileScanCompletedAuditAction: AuditAction = {
  name: 'file.scan-completed',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: FILE_RESOURCE_TYPE,
  description: 'The virus scan result of a file is recorded.',
};

export const FileScanThreatFoundAuditAction: AuditAction = {
  name: 'file.scan-threat-found',
  version: 1,
  category: AuditCategories.Security,
  severity: AuditSeverities.Critical,
  retentionClass: BuiltInRetentionClasses.Security,
  resourceType: FILE_RESOURCE_TYPE,
  description: 'The virus scan of a file detects a threat.',
};

export const FileAuditActions: AuditAction[] = [
  FileUploadedAuditAction,
  FileDownloadedAuditAction,
  FileUnsafeDownloadedAuditAction,
  FileDeletedAuditAction,
  FileScanCompletedAuditAction,
  FileScanThreatFoundAuditAction,
];

/** Actor of downloads of anonymous read file types by users who are not signed in. */
export const AnonymousAuditActor: AuditActor = { id: 'anonymous', type: 'user', name: 'Anonymous' };

/** Actor of background work of the service, such as virus scans and retention deletes. */
export const FileServiceJobAuditActor: AuditActor = {
  id: 'file-service-job',
  type: 'system',
  name: 'File service job',
};

export function toFileAuditActor(user: User): AuditActor {
  return user ? toAuditActor(user) : AnonymousAuditActor;
}

/**
 * Builds the details of an audit event about a file. Events are recorded to the tenant of the file, with the file as the
 * resource and the record ID of the file as the correlation ID.
 */
export function toFileAuditDetails(
  actor: AuditActor,
  file: FileEntity,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId: file.tenantId,
    actor,
    resource: { type: FILE_RESOURCE_TYPE, id: file.id, name: file.filename },
    correlationId: file.recordId || undefined,
    metadata: {
      filename: file.filename,
      type: file.type?.id ?? file.typeId,
      recordId: file.recordId ?? null,
      size: file.size,
      ...metadata,
    },
  };
}
