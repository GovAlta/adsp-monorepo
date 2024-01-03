import { AdspId } from '@abgov/adsp-service-sdk';
import { Subscriber } from '../../notification';
import { FormDefinition, Disposition } from './definition';

export enum FormStatus {
  Draft = 'draft',
  Locked = 'locked',
  Submitted = 'submitted',
  Archived = 'archived',
}

export interface Form {
  definition: FormDefinition;
  id: string;
  formDraftUrl: string;
  applicant: Subscriber;
  anonymousApplicant: boolean;
  created: Date;
  createdBy: { id: string; name: string };
  locked: Date;
  submitted: Date;
  dispositionStates?: Array<Disposition>;
  lastAccessed: Date;
  status: FormStatus;
  data: Record<string, unknown>;
  files: Record<string, AdspId>;
}

export interface FormCriteria {
  tenantIdEquals?: AdspId;
  definitionIdEquals?: string;
  statusEquals?: FormStatus;
  lastAccessedBefore?: Date;
  lockedBefore?: Date;
  createdByIdEquals?: string;
  hashEquals?: string;
  anonymousApplicantEquals?: boolean;
}

export interface FormDeposition {
  id: string;
  status: string;
  reason: string;
  date: Date;
}
export interface FormSubmission {
  id: string;
  formDefinitionId: string;
  formId: string;
  tenantId: AdspId;
  formData: Record<string, unknown>;
  formFiles: Record<string, AdspId>;
  created: Date;
  createdBy: string;
  updatedBy: string;
  updateDateTime: Date;
  submissionStatus: string;
  deposition: FormDeposition;
}

export interface FormSubmissionCriteria {
  tenantIdEquals?: AdspId;
  definitionIdEquals?: string;
  statusEquals?: FormStatus;
  updateDateTime?: Date;
  depositionStatusEquals?: string;
  depositionDateEquals?: Date;
  createdByIdEquals?: string;
}
