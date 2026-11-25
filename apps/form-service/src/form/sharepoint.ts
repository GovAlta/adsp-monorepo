import { AdspId } from '@abgov/adsp-service-sdk';
import { FormEntity, FormSubmissionEntity } from './model';

export type SharePointPushResult = { success: true } | { success: false; errorCode: string; retryable: boolean };

// The submission's row and files, or the submission PDF, which is generated later and pushed separately.
export type SharePointPushPart = 'submission' | 'submission-pdf';

export interface SharePointService {
  push(
    form: FormEntity,
    submission?: FormSubmissionEntity,
    submissionPdfFileId?: string,
  ): Promise<SharePointPushResult>;
}

export interface SharePointRetryService extends SharePointService {
  // Repeats the pushes that are due, and returns how many were attempted.
  retryDue(): Promise<number>;
}

// A push that has not finished. Holds identifiers only, since the form and submission are read again for each attempt.
export interface SharePointPush {
  id: string;
  tenantId: AdspId;
  formId: string;
  submissionId?: string;
  // Set when this is a push of the submission PDF rather than of the submission.
  submissionPdfFileId?: string;
  // Attempts started so far, counted when an attempt is claimed so that a crashing pod cannot retry forever.
  attempts: number;
  // The next time the push is due. While an attempt runs it is pushed out as a lease, so another pod leaves it alone.
  nextAttemptAt: Date;
  lastErrorCode?: string;
}

export interface SharePointPushRepository {
  create(push: SharePointPush): Promise<void>;
  // Takes the earliest due push, counts the attempt and leases it. Resolves null when nothing is due.
  claimDue(now: Date, leaseMs: number): Promise<SharePointPush | null>;
  reschedule(id: string, nextAttemptAt: Date, lastErrorCode: string): Promise<void>;
  delete(id: string): Promise<void>;
}
