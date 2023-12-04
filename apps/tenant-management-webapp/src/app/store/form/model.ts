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
  formDraftUrlTemplate: 'http://test.com',
  anonymousApply: false,
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
