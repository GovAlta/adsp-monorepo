import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { SecurityClassification } from '@store/common/models';

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

export interface FormState {
  definitions: Record<string, FormDefinition>;
  nextEntries: string;
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
}

export interface FormMetrics {
  formsCreated?: number;
  formsSubmitted?: number;
}
