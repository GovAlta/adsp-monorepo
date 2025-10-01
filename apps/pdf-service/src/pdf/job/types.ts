export interface PdfServiceWorkItem {
  work: 'generate' | 'unknown';
  timestamp: Date;
  jobId: string;
  tenantId: string;
  templateId: string;
  context: Record<string, unknown>;
  data: DataContent;
  fileType: string;
  filename: string;
  recordId: string;
  requestedBy: {
    id: string;
    name: string;
  };
}

interface Config {
  id: string;
  name: string;
  description: string;
  applicantRoles: string[];
  clerkRoles: string[];
  assessorRoles: string[];
  formDraftUrlTemplate: string;
  anonymousApply: boolean;
  dispositionStates: string[];
  submissionRecords: boolean;
  submissionPdfTemplate: string;
  queueTaskToProcess: Record<string, string>;
  supportTopic: boolean;
  securityClassification: string;
  dataSchema: Record<string, string | object>;
  uiSchema: Record<string, string | object>;
}

interface Content {
  config?: Config;
  data?: Record<string, string | object>;
}

interface DataContent {
  content?: Content;
  formId?: string;
  formData?: { data: Record<string, string> };
  form?: Record<string, string>;
}
