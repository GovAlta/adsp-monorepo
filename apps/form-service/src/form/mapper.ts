import { AdspId } from '@abgov/adsp-service-sdk';
import { FormSubmissionEntity } from './model';
import { Form, FormDefinition, Intake } from './types';
import { FormEntityWithJobId } from './router';

export function mapFormDefinition(entity: FormDefinition, intake?: Intake) {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    anonymousApply: entity.anonymousApply,
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

export type FormResponse = Omit<Form, 'anonymousApplicant' | 'definition' | 'applicant'> & {
  urn: string;
  definition: { id: string; name: string };
  applicant: { addressAs: string };
  jobId?: string;
};

export type FormSubmissionResponse = Omit<
  Form,
  'anonymousApplicant' | 'definition' | 'applicant'
> & {
  urn: string;
  definition: { id: string; name: string };
  applicant: { addressAs: string };
  submission: {
    id: string;
    urn: string;
  };
  jobId?: string;
};

export function mapForm(apiId: AdspId, entity: FormEntityWithJobId, includeData = false): FormResponse {
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
  };
}

export function mapFormWithFormSubmission(
  apiId: AdspId,
  entity: FormEntityWithJobId,
  submissionEntity: FormSubmissionEntity,
  includeData = false
): FormSubmissionResponse {
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
    submission: {
      id: submissionEntity.id,
      urn: submissionEntity.formSubmissionUrn,
    },
  };
}
