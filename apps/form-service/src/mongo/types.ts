import { Form } from '../form';

export type FormDoc = Omit<Form, 'definition' | 'applicant' | 'files'> & {
  tenantId: string;
  definitionId: string;
  applicantId: string;
  hash: string;
  files: Record<string, string>;
};
