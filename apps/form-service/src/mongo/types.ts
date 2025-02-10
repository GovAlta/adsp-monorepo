import { Form, FormSubmission } from '../form';

export type FormDoc = Omit<Form, 'definition' | 'applicant' | 'files'> & {
  tenantId: string;
  definitionId: string;
  applicantId: string;
  subscriberId: string;
  hash: string;
  files: Record<string, string>;
};

export type FormSubmissionDoc = Omit<FormSubmission, 'updatedBy' | 'updated' | 'formFiles'> & {
  tenantId: string;
  hash: string;
  updatedBy: string;
  updatedById: string;
  updatedDateTime: Date;
  formFiles: Record<string, string>;
};
