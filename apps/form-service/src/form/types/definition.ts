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
  dispositionStates?: Array<Disposition>;
  submissionRecords: boolean;
}

export interface Disposition {
  id: string;
  name: string;
  description: string;
}
