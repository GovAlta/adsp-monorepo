import { AdspId } from '@abgov/adsp-service-sdk';
import { Subscriber } from '../../notification';
import { FormDefinition } from './definition';

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
  created: Date;
  createdBy: { id: string; name: string };
  locked: Date;
  submitted: Date;
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
  hashEquals?: string;
}
