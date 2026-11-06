import {
  AdspId,
  AuditAction,
  AuditActor,
  AuditCategories,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  isAllowedUser,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import type { FormEntity, FormSubmissionEntity } from './model';
import { FormServiceRoles } from './roles';

const FORM_RESOURCE_TYPE = 'form';
const SUBMISSION_RESOURCE_TYPE = 'submission';
const DATA_REGISTER_RESOURCE_TYPE = 'data-register';

export const FormCreatedAuditAction: AuditAction = {
  name: 'form.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'A new draft form is created.',
};

export const FormDataUpdatedAuditAction: AuditAction = {
  name: 'form.data-updated',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'Form data (applicant input) is written. The data itself is not recorded.',
};

export const FormSubmittedAuditAction: AuditAction = {
  name: 'form.submitted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'A form is submitted.',
};

export const FormLockedAuditAction: AuditAction = {
  name: 'form.locked',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'A draft form is locked due to inactivity.',
};

export const FormUnlockedAuditAction: AuditAction = {
  name: 'form.unlocked',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'A locked form is unlocked by an administrator.',
};

export const FormSetToDraftAuditAction: AuditAction = {
  name: 'form.set-to-draft',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'A submitted form is set back to draft so that it can be changed.',
};

export const FormArchivedAuditAction: AuditAction = {
  name: 'form.archived',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'A form is archived.',
};

export const FormDeletedAuditAction: AuditAction = {
  name: 'form.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'A form, its data and its files are permanently deleted.',
};

export const FormAccessCodeSentAuditAction: AuditAction = {
  name: 'form.access-code-sent',
  version: 1,
  category: AuditCategories.Security,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Security,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'A time-limited access code is sent to the applicant of a form.',
};

export const FormAccessedWithCodeAuditAction: AuditAction = {
  name: 'form.accessed-with-code',
  version: 1,
  category: AuditCategories.Security,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Security,
  resourceType: FORM_RESOURCE_TYPE,
  description: 'Form data is accessed using a verified access code.',
};

export const SubmissionDeletedAuditAction: AuditAction = {
  name: 'submission.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: SUBMISSION_RESOURCE_TYPE,
  description: 'A form submission and its copy of the form data are permanently deleted.',
};

export const DataRegisterCreatedAuditAction: AuditAction = {
  name: 'data-register.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: DATA_REGISTER_RESOURCE_TYPE,
  description: 'A data register is created.',
};

export const DataRegisterUpdatedAuditAction: AuditAction = {
  name: 'data-register.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: DATA_REGISTER_RESOURCE_TYPE,
  description: 'The entries or description of a data register are updated.',
};

export const DataRegisterDeletedAuditAction: AuditAction = {
  name: 'data-register.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: DATA_REGISTER_RESOURCE_TYPE,
  description: 'A data register is deleted.',
};

export const FormAuditActions: AuditAction[] = [
  FormCreatedAuditAction,
  FormDataUpdatedAuditAction,
  FormSubmittedAuditAction,
  FormLockedAuditAction,
  FormUnlockedAuditAction,
  FormSetToDraftAuditAction,
  FormArchivedAuditAction,
  FormDeletedAuditAction,
  FormAccessCodeSentAuditAction,
  FormAccessedWithCodeAuditAction,
  SubmissionDeletedAuditAction,
  DataRegisterCreatedAuditAction,
  DataRegisterUpdatedAuditAction,
  DataRegisterDeletedAuditAction,
];

/**
 * Actor of operations an intake application performs on behalf of an anonymous applicant. Applicant details are
 * personal information, so they are never recorded; the calling service account is in the `callerId` metadata.
 */
export const AnonymousApplicantAuditActor: AuditActor = {
  id: 'anonymous-applicant',
  type: 'user',
  name: 'Anonymous applicant',
};

/** Actor of the scheduled jobs that lock inactive drafts and delete expired locked forms. */
export const FormServiceJobAuditActor: AuditActor = {
  id: 'form-service-job',
  type: 'system',
  name: 'Form service job',
};

type AuditedForm = Pick<FormEntity, 'tenantId' | 'id' | 'status' | 'anonymousApplicant' | 'dryRun' | 'definition'>;

const isAnonymousApplicantOperation = (user: User, form: AuditedForm): boolean =>
  !!form.anonymousApplicant && isAllowedUser(user, form.tenantId, FormServiceRoles.IntakeApp, true);

/**
 * Builds the details of an audit event about a form. Form data is never included; the metadata only describes the
 * form and the operation.
 */
export function toFormAuditDetails(
  actor: AuditActor,
  form: AuditedForm,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId: form.tenantId,
    actor,
    resource: { type: FORM_RESOURCE_TYPE, id: form.id },
    correlationId: form.id,
    metadata: {
      definitionId: form.definition?.id ?? null,
      status: form.status,
      anonymousApplicant: !!form.anonymousApplicant,
      dryRun: !!form.dryRun,
      ...metadata,
    },
  };
}

/**
 * Builds the details of a form operation performed by a user. Intake application calls on behalf of an anonymous
 * applicant are attributed to the anonymous applicant actor.
 */
export function toFormOperationAuditDetails(
  user: User,
  form: AuditedForm,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return isAnonymousApplicantOperation(user, form)
    ? toFormAuditDetails(AnonymousApplicantAuditActor, form, { ...metadata, callerId: user.id })
    : toFormAuditDetails(toAuditActor(user), form, metadata);
}

export function toSubmissionDeletedAuditDetails(
  user: User,
  submission: Pick<FormSubmissionEntity, 'tenantId' | 'id' | 'formId' | 'formDefinitionId' | 'dryRun'>,
): AuditRecordDetails {
  return {
    tenantId: submission.tenantId,
    actor: toAuditActor(user),
    resource: { type: SUBMISSION_RESOURCE_TYPE, id: submission.id },
    correlationId: submission.formId,
    metadata: {
      formId: submission.formId,
      definitionId: submission.formDefinitionId ?? null,
      dryRun: !!submission.dryRun,
    },
  };
}

export function toDataRegisterAuditDetails(
  user: User,
  tenantId: AdspId,
  name: string,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId,
    actor: toAuditActor(user),
    resource: { type: DATA_REGISTER_RESOURCE_TYPE, id: name, name },
    correlationId: name,
    metadata: { name, ...metadata },
  };
}

/**
 * Records an audit event without blocking or failing the operation. The SDK logs events that are not recorded and
 * treats a disabled audit client as a silent no-op, so only errors building the details are logged here.
 */
export function recordFormAudit(
  auditService: AuditService,
  logger: Logger,
  action: AuditAction,
  getDetails: () => AuditRecordDetails,
): void {
  try {
    void auditService.record(action, getDetails());
  } catch (err) {
    logger.warn(`Failed to record audit event ${action.name}: ${err}`, { context: 'form-audit' });
  }
}
