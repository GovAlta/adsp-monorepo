import { Form, FormSubmission } from '../form';

export type FormDoc = Omit<Form, 'definition' | 'applicant' | 'files'> & {
  tenantId: string;
  definitionId: string;
  applicantId: string;
  hash: string;
  files: Record<string, string>;
};
export type FormSubmissionDoc = Omit<FormSubmission, 'updatedBy' | 'updated'> & {
  tenantId: string;
  hash: string;
  updatedBy: string;
  updatedById: string;
  updatedDateTime: Date;
};
