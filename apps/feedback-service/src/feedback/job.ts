import { AdspId } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { Feedback } from './types';
import { PiiService } from './pii';
import { ValueService } from './value';

export interface FeedbackWorkItem {
  feedback: Feedback;
  timestamp: string;
  tenantId: string;
  digest: string;
}

export function createAnonymizeJob(logger: Logger, piiService: PiiService, valueService: ValueService) {
  return async function (
    { tenantId: tenantIdValue, timestamp: timestampValue, digest, feedback }: FeedbackWorkItem,
    retryOnError: boolean,
    done: (err?: Error) => void
  ) {
    try {
      const tenantId = AdspId.parse(tenantIdValue);

      const comment = feedback.comment ? await piiService.anonymize(tenantId, feedback.comment) : '';
      const technicalIssue = feedback.technicalIssue
        ? await piiService.anonymize(tenantId, feedback.technicalIssue)
        : '';

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
        }
      );

      done();
    } catch (err) {
      if (!retryOnError) {
        logger.error(
          `Anonymize of feedback on '${feedback.context.site}${feedback.context.view}' failed with error. ${err}`,
          {
            context: 'AnonymizeJob',
            tenant: tenantIdValue,
          }
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
  queueService: WorkQueueService<FeedbackWorkItem>;
}

export const createFeedbackJobs = ({ logger, piiService, valueService, queueService }: FeedbackJobProps): void => {
  const anonymizeJob = createAnonymizeJob(logger, piiService, valueService);

  queueService.getItems().subscribe(({ item, retryOnError, done }) => {
    anonymizeJob(item, retryOnError, done);
  });
};
