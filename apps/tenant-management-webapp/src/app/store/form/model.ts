import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { SecurityClassification } from '@store/common/models';
import { FileItem } from '@store/file/models';
import { Socket } from 'socket.io-client';

export type ExportStatus = 'queued' | 'completed' | 'failed';
export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  dataSchema: Record<string, unknown>;
  applicantRoles: string[];
  clerkRoles: string[];
  assessorRoles: string[];
  formDraftUrlTemplate: string;
  anonymousApply: boolean;
  uiSchema?: Record<string, unknown>;
  dispositionStates: Array<Disposition>;
  submissionRecords: boolean;
  submissionPdfTemplate: string;
  queueTaskToProcess: QueueTaskToProcess;
  supportTopic: boolean;
  securityClassification?: SecurityClassification;
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
  dispositionStates: [],
  submissionRecords: false,
  submissionPdfTemplate: 'submitted-form',
  queueTaskToProcess: { queueName: '', queueNameSpace: '' } as QueueTaskToProcess,
  supportTopic: false,
  securityClassification: SecurityClassification.ProtectedB,
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
  nextEntries: string;
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

  metrics: FormMetrics;
  socket: Socket;
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
