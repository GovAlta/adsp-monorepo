import { AdspId, AuditService } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import { Logger } from 'winston';
import {
  FeedbackAnonymizationFailedAuditAction,
  FeedbackAnonymizedAuditAction,
  FeedbackJobAuditActor,
  recordFeedbackAudit,
  toAuditError,
  toFeedbackAuditDetails,
  toFeedbackAuditEventId,
} from './audit';
import { Feedback } from './types';
import { PiiService } from './pii';
import { ValueService } from './value';

export interface FeedbackWorkItem {
  /** Identifies the feedback in audit records; items queued before it was added don't have one. */
  id?: string;
  feedback: Feedback;
  timestamp: string;
  tenantId: string;
  digest: string;
}

export function createAnonymizeJob(
  logger: Logger,
  piiService: PiiService,
  valueService: ValueService,
  auditService: AuditService,
) {
  return async function (
    { id, tenantId: tenantIdValue, timestamp: timestampValue, digest, feedback }: FeedbackWorkItem,
    retryOnError: boolean,
    done: (err?: Error) => void,
  ) {
    try {
      const tenantId = AdspId.parse(tenantIdValue);
      const feedbackId = id || randomUUID();

      let comment: string, technicalIssue: string;
      try {
        comment = feedback.comment ? await piiService.anonymize(tenantId, feedback.comment) : '';
        technicalIssue = feedback.technicalIssue ? await piiService.anonymize(tenantId, feedback.technicalIssue) : '';
      } catch (err) {
        // Only the final attempt is recorded; the work item is dead lettered after it fails.
        if (!retryOnError) {
          recordFeedbackAudit(auditService, logger, FeedbackAnonymizationFailedAuditAction, () => ({
            ...toFeedbackAuditDetails(FeedbackJobAuditActor, tenantId, feedbackId, feedback, {
              error: toAuditError(err),
            }),
            status: 'error',
            eventId: toFeedbackAuditEventId(FeedbackAnonymizationFailedAuditAction, feedbackId),
          }));
        }
        throw err;
      }

      await valueService.writeValue(tenantId, {
        ...feedback,
        comment,
        technicalIssue,
        timestamp: new Date(timestampValue),
        digest,
      });

      logger.info(
        `Wrote feedback on '${feedback.context.site}${feedback.context.view}' to value service. Digest sha256-${digest}`,
        {
          context: 'AnonymizeJob',
          tenant: tenantIdValue,
        },
      );

      if (feedback.comment || feedback.technicalIssue) {
        recordFeedbackAudit(auditService, logger, FeedbackAnonymizedAuditAction, () => ({
          ...toFeedbackAuditDetails(FeedbackJobAuditActor, tenantId, feedbackId, feedback),
          eventId: toFeedbackAuditEventId(FeedbackAnonymizedAuditAction, feedbackId),
        }));
      }

      done();
    } catch (err) {
      if (!retryOnError) {
        logger.error(
          `Anonymize of feedback on '${feedback.context.site}${feedback.context.view}' failed with error. ${err}`,
          {
            context: 'AnonymizeJob',
            tenant: tenantIdValue,
          },
        );
      }

      done(err);
    }
  };
}

interface FeedbackJobProps {
  logger: Logger;
  piiService: PiiService;
  valueService: ValueService;
  auditService: AuditService;
  queueService: WorkQueueService<FeedbackWorkItem>;
}

export const createFeedbackJobs = ({
  logger,
  piiService,
  valueService,
  auditService,
  queueService,
}: FeedbackJobProps): void => {
  const anonymizeJob = createAnonymizeJob(logger, piiService, valueService, auditService);

  queueService.getItems().subscribe(({ item, retryOnError, done }) => {
    anonymizeJob(item, retryOnError, done);
  });
};
