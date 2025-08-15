import { SecurityClassificationType } from './form';
export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  anonymousApply: boolean;
  oneFormPerApplicant?: boolean;
  applicantRoles: string[];
  assessorRoles: string[];
  clerkRoles: string[];
  formDraftUrlTemplate?: string;
  dataSchema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  dispositionStates?: Array<Disposition>;
  submissionRecords?: boolean;
  submissionPdfTemplate?: string;
  supportTopic?: boolean;
  queueTaskToProcess?: QueueTaskToProcess;
  securityClassification?: SecurityClassificationType;
  scheduledIntakes?: boolean;
  dryRun?: boolean;
  registeredId?: string;
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
