import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { SecurityClassification } from '@store/common/models';
import { Socket } from 'socket.io-client';

export type ExportStatus = 'queued' | 'completed' | 'failed';
export type ExportFormat = 'json' | 'csv';

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  dataSchema: Record<string, unknown>;
  applicantRoles: string[];
  clerkRoles: string[];
  assessorRoles: string[];
  formDraftUrlTemplate: string;
  oneFormPerApplicant: boolean;
  anonymousApply: boolean;
  scheduledIntakes: boolean;
  uiSchema?: Record<string, unknown>;
  dispositionStates: Array<Disposition>;
  submissionRecords: boolean;
  submissionPdfTemplate: string;
  queueTaskToProcess: QueueTaskToProcess;
  supportTopic: boolean;
  securityClassification?: SecurityClassification;
  resourceTags?: FormResourceTagResult[];
  dryRun?: boolean;
  ministry?: string;
  registeredId?: string;
  programName?: string | null;
}

export interface FormResourceTagResponse {
  formDefinitionId: string;
  resourceTags: FormResourceTagResult[];
}

export interface FormResourceTagResult {
  urn: string;
  label: string;
  value: string;
  _links: Record<string, unknown>;
}

export interface Disposition {
  id: string;
  name: string;
  description: string;
}

export interface QueueTaskToProcess {
  queueNameSpace: string;
  queueName: string;
}

export const defaultFormDefinition: FormDefinition = {
  id: '',
  name: '',
  description: '',
  dataSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  uiSchema: {
    type: 'VerticalLayout',
    elements: [],
  },
  applicantRoles: ['urn:ads:platform:form-service:form-applicant'],
  clerkRoles: [],
  assessorRoles: [],
  formDraftUrlTemplate: '',
  anonymousApply: false,
  oneFormPerApplicant: true,
  registeredId: null,
  scheduledIntakes: false,
  dispositionStates: [],
  submissionRecords: false,
  submissionPdfTemplate: 'submitted-form',
  queueTaskToProcess: { queueName: '', queueNameSpace: '' } as QueueTaskToProcess,
  supportTopic: false,
  securityClassification: SecurityClassification.ProtectedB,
  programName: null,
};
export interface Stream {
  namespace: string;
  name: string;
  correlationId: string;
  context: {
    jobId: string;
    templateId: string;
  };
  timestamp: string;
  payload: {
    jobId: string;
    templateId: string;
    file?: {
      urn: string;
      id: string;
      filename: string;
    };
    error?: string;
    requestedBy: {
      id: string;
      name: string;
    };
  };
}
export interface FormState {
  definitions: Record<string, FormDefinition>;
  nextEntries: string | null;
  exportResult: FormExportResponse;
  editor: {
    selectedId: string;
    loading: boolean;
    saving: boolean;
    original: FormDefinition;
    modified: Omit<FormDefinition, 'dataSchema' | 'uiSchema'>;
    dataSchemaDraft: string;
    uiSchemaDraft: string;
    dataSchema: JsonSchema;
    uiSchema: UISchemaElement;
    dataSchemaError?: string;
    uiSchemaError?: string;
    resolvedDataSchema: JsonSchema;
  };
  columns: ColumnOption[];
  metrics: FormMetrics;
  socket: Socket;

  formResourceTag: FormResourceTag;
  registerIdDefinition: Record<string, FormDefinition>;
}

export interface FormResourceTag {
  selectedTag: Tag | null;
  searchedTag?: FormResourceTagResult;
  searchedTagExists?: boolean;
  tags: Tag[];
  tagsLoading: boolean;
  tagsError?: string;
  tagResources: Record<string, FormDefinition>;
  nextEntries: string | null;
}

export interface FormExportResponse {
  id?: string;
  formDefinitionId?: string;
  formId?: string;
  status?: ExportStatus;
  urn?: string;
  result?: {
    urn?: string;
    id?: string;
    filename?: string;
  };
  payload?: {
    file?: {
      id?: string;
    };
    error?: string;
  };
}

export interface FormMetrics {
  formsCreated?: number;
  formsSubmitted?: number;
}
export interface ColumnOption {
  id: string;
  label: string;
  selected: boolean;
  group: 'Standard Properties' | 'Form Data';
}

export interface FormInfoItem {
  urn?: string;
  id?: string;
  jobId?: string;
  definition?: FormDefinition;
  anonymousApplicant?: boolean;
  applicant?: {
    addressAs?: string;
  };
  status?: ExportStatus;
  created?: string;
  createdBy?: {
    id?: string;
    name?: string;
  };
  lastAccessed?: string;
  locked?: string;
  submitted?: string;
  submission?: {
    id?: string;
    name?: string;
  };
}

export interface Form {
  definition?: FormDefinition;
  id: string;
  formDraftUrl: string;
  applicant?: {
    id: string;
    urn: string;
    userId: string;
    addressAs: string;
    channels: { channel: string; address: string }[];
  };
  anonymousApplicant: boolean;
  created: Date;
  createdBy: { id: string; name: string };
  locked: Date;
  submitted: Date;
  lastAccessed: Date;
  status: string;
  data: Record<string, unknown>;
  files: Record<string, string>;
  securityClassification?: string;
}

export interface SubmissionInfoItem {
  urn?: string;
  id?: string;
  definitionId?: string;
  tenantId?: string;
  formId?: string;
  //eslint-disable-next-line
  formData?: {};
  //eslint-disable-next-line
  formFiles?: {};
  created?: string;
  createdBy?: {
    id?: string;
    name?: string;
  };
  updatedBy?: string;
  updated?: string;
  disposition?: {
    status?: ExportStatus;
    reason?: string;
    date?: string;
  };
}

export interface Tag {
  urn: string;
  label: string;
  value: string;
  _links: Record<string, { href: string }>;
}
