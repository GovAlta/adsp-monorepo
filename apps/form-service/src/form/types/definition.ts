export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  anonymousApply: boolean;
  applicantRoles: string[];
  assessorRoles: string[];
  clerkRoles: string[];
  formDraftUrlTemplate: string;
  dataSchema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  dispositionStates?: Array<Disposition>;
  submissionRecords: boolean;
  supportTopic: boolean;
  queueTaskToProcess?: QueueTaskToProcess;
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
