import { FormRepository } from './form';
import { FormSubmissionRepository } from './formSubmission';
import { FormRegistrationRepository } from './registration';
import { SharePointPushRepository } from '../sharepoint';

export * from './definition';
export * from './form';
export * from './formSubmission';
export * from './registration';

export interface Repositories {
  formRepository: FormRepository;
  formSubmissionRepository: FormSubmissionRepository;
  formRegistrationRepository: FormRegistrationRepository;
  sharepointPushRepository: SharePointPushRepository;
  isConnected: () => boolean;
}
