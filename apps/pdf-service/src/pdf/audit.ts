import {
  AdspId,
  AuditAction,
  AuditActor,
  AuditCategories,
  AuditRecordDetails,
  AuditSeverities,
} from '@abgov/adsp-service-sdk';
import type { PdfTemplateConfiguration, UserInfo } from './types';

const PDF_JOB_RESOURCE_TYPE = 'pdf-job';
const PDF_TEMPLATE_RESOURCE_TYPE = 'pdf-template';
// Keycloak names service account users with this prefix.
const SERVICE_ACCOUNT_PREFIX = 'service-account-';
const MAX_ERROR_LENGTH = 1000;

// Retention classes are not set, so Audit Service derives them from the category.
export const PdfJobCreatedAuditAction: AuditAction = {
  name: 'job.created',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  resourceType: PDF_JOB_RESOURCE_TYPE,
  description: 'A PDF generation job is submitted.',
};

export const PdfJobGeneratedAuditAction: AuditAction = {
  name: 'job.generated',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  resourceType: PDF_JOB_RESOURCE_TYPE,
  description:
    'A PDF generation job finishes, with status success when the PDF is stored in File Service or failure when the job fails.',
};

export const PdfTemplateCreatedAuditAction: AuditAction = {
  name: 'template.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: PDF_TEMPLATE_RESOURCE_TYPE,
  description: 'A PDF template is created.',
};

export const PdfTemplateUpdatedAuditAction: AuditAction = {
  name: 'template.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: PDF_TEMPLATE_RESOURCE_TYPE,
  description: 'A PDF template is updated, which changes the content of documents generated from it.',
};

export const PdfTemplateDeletedAuditAction: AuditAction = {
  name: 'template.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: PDF_TEMPLATE_RESOURCE_TYPE,
  description: 'A PDF template is deleted.',
};

export const PdfAuditActions: AuditAction[] = [
  PdfJobCreatedAuditAction,
  PdfJobGeneratedAuditAction,
  PdfTemplateCreatedAuditAction,
  PdfTemplateUpdatedAuditAction,
  PdfTemplateDeletedAuditAction,
];

/**
 * Converts the requester carried in a work item into the actor of the job worker's records, so that they are attributed
 * to the same actor as the job.created record of the request.
 */
export function toRequesterAuditActor({ id, name }: UserInfo): AuditActor {
  return {
    id,
    type: name?.startsWith(SERVICE_ACCOUNT_PREFIX) ? 'service' : 'user',
    name: name || undefined,
  };
}

export interface PdfJobAuditTarget {
  tenantId: AdspId;
  jobId: string;
  templateId: string;
  filename: string;
  fileType: string;
  recordId: string;
}

/**
 * Builds the details of an audit event about a PDF generation job. The record ID of the generated file is the
 * correlation ID, which File Service also uses for the audit events of that file.
 */
export function toPdfJobAuditDetails(
  actor: AuditActor,
  { tenantId, jobId, templateId, filename, fileType, recordId }: PdfJobAuditTarget,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId,
    actor,
    resource: { type: PDF_JOB_RESOURCE_TYPE, id: jobId, name: filename },
    correlationId: recordId,
    metadata: { templateId, filename, fileType, recordId, ...metadata },
  };
}

export const toAuditError = (err: unknown): string => `${err}`.slice(0, MAX_ERROR_LENGTH);

/** Builds the details of an audit event about a PDF template. */
export function toPdfTemplateAuditDetails(
  actor: AuditActor,
  tenantId: AdspId,
  { id, name }: { id: string; name?: string },
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId,
    actor,
    resource: { type: PDF_TEMPLATE_RESOURCE_TYPE, id, name },
    metadata: { templateId: id, name, ...metadata },
  };
}

const TEMPLATE_FIELDS = [
  'name',
  'description',
  'template',
  'header',
  'footer',
  'additionalStyles',
  'variables',
] as const;

/** Names of the template fields that differ; recorded instead of a change set because template content can be large. */
export function changedTemplateFields(
  before: Partial<PdfTemplateConfiguration>,
  after: Partial<PdfTemplateConfiguration>,
): string[] {
  return TEMPLATE_FIELDS.filter((field) => before[field] !== after[field]);
}
