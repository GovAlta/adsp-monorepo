import { AdspId } from '@abgov/adsp-service-sdk';
import { Subscriber } from '../../notification';
import { FormDefinition } from './definition';

export enum FormStatus {
  Draft = 'draft',
  Locked = 'locked',
  Submitted = 'submitted',
  Archived = 'archived',
}

export type SecurityClassificationType = 'protected a' | 'protected b' | 'protected c' | 'public';

export interface Form {
  definition?: FormDefinition;
  id: string;
  formDraftUrl: string;
  applicant?: Subscriber;
  anonymousApplicant: boolean;
  created: Date;
  createdBy: { id: string; name: string };
  locked: Date;
  submitted: Date;
  lastAccessed: Date;
  status: FormStatus;
  data: Record<string, unknown>;
  files: Record<string, AdspId>;
  securityClassification?: SecurityClassificationType;
  dryRun: boolean;
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
  dataCriteria?: Record<string, unknown>;
}
