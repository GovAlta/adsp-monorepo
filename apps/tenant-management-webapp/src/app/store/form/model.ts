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
  dataSchema: {},
  uiSchema: {},
  applicantRoles: [],
  clerkRoles: [],
  assessorRoles: [],
  formDraftUrlTemplate: '',
  anonymousApply: false,
  dispositionStates: [],
  submissionRecords: false,
  submissionPdfTemplate: 'submitted-form',
  queueTaskToProcess: { queueName: '', queueNameSpace: '' } as QueueTaskToProcess,
  supportTopic: false,
  securityClassification: null,
};

export interface FormState {
  definitions: FormDefinition[];
  nextEntries: string;
}
