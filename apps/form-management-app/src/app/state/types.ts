import { JsonSchema, UISchemaElement } from '@jsonforms/core';

export const CONFIGURATION_SERVICE_ID = 'urn:ads:platform:configuration-service';
export const PUSH_SERVICE_ID = 'urn:ads:platform:push-service';
export const FORM_SERVICE_ID = 'urn:ads:platform:form-service';
export const EXPORT_SERVICE_ID = 'urn:ads:platform:export-service';
export const CALENDAR_SERVICE_ID = 'urn:ads:platform:calendar-service';
export const DIRECTORY_SERVICE_ID = 'urn:ads:platform:directory-service';
export const CACHE_SERVICE_ID = 'urn:ads:platform:cache-service';
export const FORM_APP_ID = 'urn:ads:platform:form-app';

export type FilterKey = 'program' | 'ministry' | 'acts-of-legislation';

export interface Session {
  authenticated: boolean;
  clientId: string;
  realm: string;
  userInfo: {
    sub: string;
    email: string;
    name: string;
    preferredUsername: string;
    emailVerified: boolean;
  };
  realmAccess?: {
    roles?: string[];
  };
  resourceAccess?: {
    [key: string]: {
      roles?: string[];
    };
  };
  credentials: {
    token: string;
    tokenExp: number;
    refreshToken: string;
    refreshTokenExp: number;
  };
}

export interface PagedResults<T> {
  results: T[];
  page: {
    after: string;
    next: string;
  };
}

export interface CalendarEvent {
  urn: string;
  id: number;
  start: string;
  end?: string;
  name: string;
  description: string;
  recordId: string;
}

interface DispositionState {
  id: string;
  name: string;
  description: string;
}

export enum SecurityClassification {
  ProtectedA = 'protected a',
  ProtectedB = 'protected b',
  ProtectedC = 'protected c',
  Public = 'public',
}


export interface Intake {
  urn: string;
  start: string;
  end?: string;
  isAllDay: boolean;
  isUpcoming: boolean;
}

export interface QueueTaskToProcess {
  queueNameSpace: string;
  queueName: string;
}

export interface Disposition {
  id: string;
  name: string;
  description: string;
}


export interface FormDefinition {
  urn: string;
  id: string;
  revision: number;
  name: string;
  description: string;
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
  applicantRoles: string[];
  clerkRoles: string[];
  assessorRoles: string[];
  dispositionStates: DispositionState[];
  securityClassification?: SecurityClassification;
  submissionPdfTemplate: string;
  queueTaskToProcess: QueueTaskToProcess
  submissionRecords: boolean;
  anonymousApply: boolean;
  oneFormPerApplicant: boolean;
  generatesPdf: boolean;
  scheduledIntakes: boolean;
  supportTopic: boolean;
  intake?: Intake;
  ministry?: string;
  programName?: string;
  registeredId?: string;
  actsOfLegislation?: string;
  formDraftUrlTemplate?: string;
}

export enum FormStatus {
  draft = 'Draft',
  submitted = 'Submitted',
  archived = 'Archived',
}

export interface Form {
  urn: string;
  id: string;
  formId: string;
  status: FormStatus;
  created: string;
  createdBy: { id: string; name: string };
  submitted: string;
  lastAccessed: string;
  applicant: { addressAs: string };
  data?: Record<string, unknown>;
  files?: Record<string, string>;
  submission?: FormSubmission;
  dryRun?: boolean;
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
