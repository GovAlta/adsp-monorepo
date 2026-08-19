import { AdspId } from '@abgov/adsp-service-sdk';
import { SecurityClassificationType } from './form';

export interface FormDisposition {
  id: string;
  status: string;
  reason: string;
  date: Date;
}

// clean-code-ignore: RULE-19 — type declarations only.
export interface FormSubmissionNote {
  id: string;
  content: string;
  created: Date;
  createdBy: {
    id: string;
    name: string;
  };
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
  notes?: FormSubmissionNote[];
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
