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
  queueTaskToProcess: QueueTaskToProcess;
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
  queueTaskToProcess: { queueName: '', queueNameSpace: '' } as QueueTaskToProcess,
};

export interface FormState {
  definitions: Record<string, FormDefinition>;
}

export interface UpdateFormConfig {
  operation: string;
  update: Record<string, FormDefinition>;
}

export interface DeleteFormConfig {
  operation: string;
  property: string;
}
