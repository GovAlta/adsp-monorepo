import { Form } from '../form';

export type FormDoc = Omit<Form, 'definition' | 'applicant'> & {
  tenantId: string;
  definitionId: string;
  applicantId: string;
  hash: string;
};
