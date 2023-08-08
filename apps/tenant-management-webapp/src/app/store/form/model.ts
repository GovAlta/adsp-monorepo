export interface FormDefinition {
  id: string;
  name: string;
  description: string;
}

export const defaultFormDefinition: FormDefinition = {
  id: '',
  name: '',
  description: '',
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
