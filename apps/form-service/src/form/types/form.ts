import { AdspId } from '@abgov/adsp-service-sdk';
import { Subscriber } from '../../notification';
import { FormDefinition, Disposition } from './definition';

export enum FormStatus {
  Draft = 'draft',
  Locked = 'locked',
  Submitted = 'submitted',
  Archived = 'archived',
}

export enum SecurityClassification {
  ProtectedA = 'protected a',
  ProtectedB = 'protected b',
  ProtectedC = 'protected c',
  Public = 'public',
}

export type SecurityClassificationType = SecurityClassification & null;

export interface Form {
  definition: FormDefinition;
  id: string;
  formDraftUrl: string;
  applicant?: Subscriber;
  anonymousApplicant: boolean;
  created: Date;
  createdBy: { id: string; name: string };
  locked: Date;
  submitted: Date;
  dispositionStates?: Array<Disposition>;
  submissionRecords?: boolean;
  submissionPdfTemplate?: string;
  supportTopic?: boolean;
  lastAccessed: Date;
  status: FormStatus;
  data: Record<string, unknown>;
  files: Record<string, AdspId>;
  securityClassification?: SecurityClassificationType;
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
