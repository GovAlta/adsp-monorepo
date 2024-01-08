import { FormRepository } from './form';
import { FormSubmissionRepository } from './formSubmission';

export * from './definition';
export * from './form';
export * from './formSubmission';

export interface Repositories {
  formRepository: FormRepository;
  formSubmissionRepository: FormSubmissionRepository;
  isConnected: () => boolean;
}
