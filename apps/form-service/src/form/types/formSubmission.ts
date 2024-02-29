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
  formData: Record<string, unknown>;
  formFiles: Record<string, AdspId>;
  created: Date;
  createdBy: FormSubmissionCreatedBy;
  updatedBy: string;
  updatedDateTime: Date;
  submissionStatus?: string;
  disposition: FormDisposition;
  hash: string;
}

export interface FormSubmissionCriteria {
  formIdEquals: string;
  tenantIdEquals?: AdspId;
  definitionIdEquals?: string;
  submissionStatusEquals?: string;
  createDateBefore?: Date;
  createDateAfter?: Date;
  dispositionStatusEquals?: string;
  dispositionDateBefore?: Date;
  dispositionDateAfter?: Date;
  createdByIdEquals?: string;
}
