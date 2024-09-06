export interface SiteVerifyResponse {
  success: boolean;
  score: number;
  action: string;
}

export interface FormResponse {
  id: string;
  formDefinitionId: string;
  status: string;
  submitted: Date;
  createdBy: {
    id: string;
    name: string;
  };
  submission: {
    id: string;
    urn: string;
  };
}

export enum FormStatus {
  Draft = 'draft',
  Locked = 'locked',
  Submitted = 'submitted',
  Archived = 'archived',
}
