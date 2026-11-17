import { FormEntity, FormSubmissionEntity } from './model';

export type SharePointPushResult = { success: true } | { success: false; errorCode: string; retryable: boolean };

export interface SharePointService {
  push(form: FormEntity, submission?: FormSubmissionEntity): Promise<SharePointPushResult>;
}
