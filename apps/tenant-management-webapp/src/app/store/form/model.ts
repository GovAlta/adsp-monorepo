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
  actsOfLegislation?: string[];
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

export interface FormStateTag {
  formResourceTag: FormResourceTag;
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

export interface Tag {
  urn: string;
  label: string;
  value: string;
  _links: Record<string, { href: string }>;
}
