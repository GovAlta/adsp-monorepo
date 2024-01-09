import { AdspId } from '@abgov/adsp-service-sdk';

export interface FormDisposition {
  id: string;
  status: string;
  reason: string;
  date: Date;
}

export interface FormSubmissionCreatedBy {
  id: string;
  name: string;
}

export interface FormSubmission {
  id: string;
  formDefinitionId: string;
  formId: string;
  tenantId: AdspId;
  formData: Record<string, unknown>;
  formFiles: Record<string, AdspId>;
  created: Date;
  createdBy: FormSubmissionCreatedBy;
  updatedBy: string;
  updatedDateTime: Date;
  submissionStatus: string;
  disposition: FormDisposition;
}
export interface FormSubmissionTenant {
  id: string;
  definitionId: string;
  tenantId: string;
  formId: string;
  formData: Record<string, unknown>;
  formFiles: Record<string, AdspId>;
  created: Date;
  createdBy: string;
  updatedBy: string;
  updateDateTime: Date;
  submissionStatus: string;
  disposition: FormDisposition;
}

export interface FormSubmissionCriteria {
  tenantIdEquals?: AdspId;
  definitionIdEquals?: string;
  statusEquals?: string;
  createDateBefore?: Date;
  createDateAfter?: Date;
  updateDateTime?: Date;
  dispositionStatusEquals?: string;
  dispositionDateEquals?: Date;
  createdByIdEquals?: string;
}
