// clean-code-ignore: RULE-19 — type declarations only.
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
  includeDataInSubmission?: boolean;
  registeredId?: string;
  customSubmissionEvent?: CustomSubmissionEvent;
  reviewConfiguration?: ReviewConfiguration;
}

export interface CustomSubmissionEvent {
  namespace: string;
  name: string;
}

export interface ReviewColumn {
  path: string;
}

export interface ReviewConfiguration {
  columns: ReviewColumn[];
  // Address that applicant questions are forwarded to when no reviewer is part of the conversation.
  questionsEmail?: string;
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
