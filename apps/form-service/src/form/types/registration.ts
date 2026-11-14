// clean-code-ignore: RULE-19 — type declarations only.
import { AdspId } from '@abgov/adsp-service-sdk';

export enum RegistrationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Denied = 'denied',
}

export interface RegistrationReviewer {
  id: string;
  name: string;
}

export interface FormRegistration {
  id: string;
  tenantId: AdspId;
  formDefinitionId: string;
  status: RegistrationStatus;
  firstName: string;
  lastName: string;
  email: string;
  data: Record<string, unknown>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: RegistrationReviewer;
}

export interface FormRegistrationCriteria {
  tenantIdEquals: AdspId;
  definitionIdEquals: string;
  statusEquals?: RegistrationStatus;
}

export interface FormRegistrationCreate {
  firstName: string;
  lastName: string;
  email: string;
  data?: Record<string, unknown>;
}
