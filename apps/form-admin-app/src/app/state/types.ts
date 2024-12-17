import { JsonSchema, UISchemaElement } from '@jsonforms/core';

export const PUSH_SERVICE_ID = 'urn:ads:platform:push-service';
export const FORM_SERVICE_ID = 'urn:ads:platform:form-service';

export interface PagedResults<T> {
  results: T[];
  page: {
    after: string;
    next: string;
  };
}

interface DispositionState {
  id: string;
  name: string;
  description: string;
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
  applicantRoles: string[];
  clerkRoles: string[];
  dispositionStates: DispositionState[];
  submissionRecords: boolean;
  anonymousApply: boolean;
  generatesPdf: boolean;
}

export enum FormStatus {
  draft = 'Draft',
  submitted = 'Submitted',
}

export interface Form {
  urn: string;
  id: string;
  status: FormStatus;
  created: string;
  createdBy: { id: string; name: string };
  submitted: string;
  lastAccessed: string;
  applicant: { addressAs: string };
  data?: Record<string, unknown>;
  files?: Record<string, string>;
}

export interface FormDisposition {
  id: string;
  status: string;
  reason: string;
  date: string;
}

export interface FormSubmission {
  urn: string;
  id: string;
  formId: string;
  formDefinitionId: string;
  formData: Record<string, string>;
  formFiles: Record<string, string>;
  created: string;
  createdBy: {
    id: string;
    name: string;
  };
  disposition: FormDisposition;
  updated: string;
  updatedBy: {
    id: string;
    name: string;
  };
  hash: string;
}

export interface SerializedAxiosError {
  status: number;
  message: string;
}

export type FeedbackMessageLevel = 'info' | 'success' | 'warn' | 'error';
export interface FeedbackMessage {
  id: string;
  level: FeedbackMessageLevel;
  message: string;
  in?: string;
}
