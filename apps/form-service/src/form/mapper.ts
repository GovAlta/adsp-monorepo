import { AdspId } from '@abgov/adsp-service-sdk';
import { FormDefinitionEntity, FormEntity, FormSubmissionEntity } from './model';
import { Form } from './types';

export function mapFormDefinition(entity: FormDefinitionEntity) {
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
    generatesPdf: !!entity.submissionPdfTemplate,
  };
}

export type FormResponse = Omit<Form, 'anonymousApplicant' | 'definition' | 'applicant' | 'data' | 'files'> & {
  urn: string;
  definition: { id: string; name: string };
  applicant: { addressAs: string };
};

export type FormSubmissionResponse = Omit<
  Form,
  'anonymousApplicant' | 'definition' | 'applicant' | 'data' | 'files'
> & {
  urn: string;
  definition: { id: string; name: string };
  applicant: { addressAs: string };
  submission: {
    id: string;
    urn: string;
  };
};

export function mapForm(apiId: AdspId, entity: FormEntity): FormResponse {
  return {
    urn: `${apiId}:/forms/${entity.id}`,
    id: entity.id,
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
  };
}

export function mapFormWithFormSubmission(
  apiId: AdspId,
  entity: FormEntity,
  submissionEntity: FormSubmissionEntity
): FormSubmissionResponse {
  return {
    urn: `${apiId}:/forms/${entity.id}`,
    id: entity.id,
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
    submission: {
      id: submissionEntity.id,
      urn: submissionEntity.formSubmissionUrn,
    },
  };
}
