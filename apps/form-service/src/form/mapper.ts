import { AdspId } from '@abgov/adsp-service-sdk';
import { FormSubmissionEntity } from './model';
import { FormDefinition, Intake } from './types';
import { FormEntityWithJobId } from './router';

export function mapFormDefinition(entity: FormDefinition, revision: number, intake?: Intake) {
  return {
    id: entity.id,
    revision,
    name: entity.name,
    description: entity.description,
    anonymousApply: entity.anonymousApply,
    oneFormPerApplicant: entity.oneFormPerApplicant,
    applicantRoles: entity.applicantRoles,
    assessorRoles: entity.assessorRoles,
    clerkRoles: entity.clerkRoles,
    formDraftUrlTemplate: entity.formDraftUrlTemplate,
    dataSchema: entity.dataSchema,
    uiSchema: entity.uiSchema,
    dispositionStates: entity.dispositionStates,
    generatesPdf: !!entity.submissionPdfTemplate && !entity.anonymousApply,
    submissionRecords: entity.submissionRecords,
    scheduledIntakes: entity.scheduledIntakes,
    supportTopic: entity.supportTopic,
    intake,
  };
}

export function mapForm(apiId: AdspId, entity: FormEntityWithJobId, includeData = false) {
  return {
    urn: `${apiId}:/forms/${entity.id}`,
    id: entity.id,
    jobId: entity?.jobId,
    securityClassification: entity?.securityClassification,
    definition: entity.definition
      ? {
          id: entity.definition.id,
          name: entity.definition.name,
        }
      : null,
    formDraftUrl: entity.formDraftUrl,
    status: entity.status,
    created: entity.created,
    createdBy: entity.createdBy,
    locked: entity.locked,
    submitted: entity.submitted,
    lastAccessed: entity.lastAccessed,
    applicant: entity.applicant
      ? {
          addressAs: entity.applicant.addressAs,
        }
      : null,
    data: includeData ? entity.data : undefined,
    files: includeData ? entity.files : undefined,
    _links: {
      self: { href: `${apiId}:/forms/${entity.id}` },
      data: { href: `${apiId}:/forms/${entity.id}/data` },
      submissions: entity.definition?.submissionRecords && { href: `${apiId}:/forms/${entity.id}/submissions` },
      collection: { href: `${apiId}:/forms` },
    },
    dryRun: entity.dryRun,
  };
}

export function mapFormWithFormSubmission(
  apiId: AdspId,
  entity: FormEntityWithJobId,
  submissionEntity: FormSubmissionEntity,
  includeData = false
) {
  const result = mapForm(apiId, entity, includeData);
  return {
    ...result,
    submission: {
      id: submissionEntity.id,
      urn: submissionEntity.formSubmissionUrn,
    },
  };
}

export function mapFormSubmission(apiId: AdspId, entity: FormSubmissionEntity) {
  return {
    urn: `${apiId}:/submissions/${entity.id}`,
    id: entity.id,
    formId: entity.formId,
    formDefinitionId: entity.formDefinitionId,
    formDefinitionRevision: entity.formDefinitionRevision,
    formData: entity.formData,
    formFiles: Object.entries(entity.formFiles || {}).reduce((f, [k, v]) => ({ ...f, [k]: v?.toString() }), {}),
    created: entity.created,
    createdBy: { id: entity.createdBy.id, name: entity.createdBy.name },
    securityClassification: entity.securityClassification,
    disposition: entity.disposition
      ? {
          id: entity.disposition.id,
          date: entity.disposition.date,
          status: entity.disposition.status,
          reason: entity.disposition.reason,
        }
      : null,
    updated: entity.updated,
    updatedBy: { id: entity.updatedBy.id, name: entity.updatedBy.name },
    hash: entity.hash,
    _links: {
      self: { href: `${apiId}:/submissions/${entity.id}` },
      alternate: { href: `${apiId}:/forms/${entity.formId}/submissions/${entity.id}` },
      form: { href: `${apiId}:/forms/${entity.formId}` },
      collection: { href: `${apiId}:/submissions` },
    },
  };
}
