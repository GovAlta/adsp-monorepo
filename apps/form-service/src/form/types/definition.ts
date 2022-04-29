export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  anonymousApply: boolean;
  applicantRoles: string[];
  assessorRoles: string[];
  formDraftUrlTemplate: string;
}
