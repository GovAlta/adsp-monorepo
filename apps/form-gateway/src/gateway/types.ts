export interface SimpleFormResponse {
  id: string;
  formDefinitionId: string;
  status: string;
  submitted: Date;
}

export enum FormStatus {
  Draft = 'draft',
  Locked = 'locked',
  Submitted = 'submitted',
  Archived = 'archived',
}
