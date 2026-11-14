import { FormRepository } from './form';
import { FormSubmissionRepository } from './formSubmission';
import { FormRegistrationRepository } from './registration';

export * from './definition';
export * from './form';
export * from './formSubmission';
export * from './registration';

export interface Repositories {
  formRepository: FormRepository;
  formSubmissionRepository: FormSubmissionRepository;
  formRegistrationRepository: FormRegistrationRepository;
  isConnected: () => boolean;
}
