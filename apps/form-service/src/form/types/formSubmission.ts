import { AdspId } from '@abgov/adsp-service-sdk';
import { SecurityClassificationType } from './form';

export interface FormDisposition {
  id: string;
  status: string;
  reason: string;
  date: Date;
}

export interface FormSubmission {
  id: string;
  formDefinitionId: string;
  formDefinitionRevision: number;
  formId: string;
  formData: Record<string, unknown>;
  formFiles: Record<string, AdspId>;
  created: Date;
  createdBy: {
    id: string;
    name: string;
  };
  updatedBy: {
    id: string;
    name: string;
  };
  updated: Date;
  submissionStatus?: string;
  disposition: FormDisposition;
  hash: string;
  securityClassification?: SecurityClassificationType;
  dryRun: boolean;
}

export interface FormSubmissionCriteria {
  formIdEquals: string;
  tenantIdEquals?: AdspId;
  definitionIdEquals?: string;
  submissionStatusEquals?: string;
  createDateBefore?: Date;
  createDateAfter?: Date;
  dispositioned?: boolean;
  dispositionStatusEquals?: string;
  dispositionDateBefore?: Date;
  dispositionDateAfter?: Date;
  createdByIdEquals?: string;
  dataCriteria?: Record<string, unknown>;
}
