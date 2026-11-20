import { Logger } from 'winston';
import * as schedule from 'node-schedule';
import { FormRepository } from '../repository';
import { createDeleteJob } from './delete';
import { createLockJob } from './lock';
import { createSharePointRetryJob } from './sharepointRetry';
import { AdspId, AuditService, EventService, instrumentJob } from '@abgov/adsp-service-sdk';
import { FileService } from '../../file';
import { NotificationService } from '../../notification';
import { SharePointRetryService } from '../sharepoint';

interface FormJobProps {
  apiId: AdspId;
  logger: Logger;
  repository: FormRepository;
  eventService: EventService;
  auditService: AuditService;
  fileService: FileService;
  notificationService: NotificationService;
  sharepointService?: SharePointRetryService;
}

// Retries are due no sooner than a minute apart, so this only sets how late a retry can run.
const SHAREPOINT_RETRY_SCHEDULE = '*/15 * * * * *';

export const scheduleFormJobs = (props: FormJobProps): void => {
  const lockJob = createLockJob(props);
  schedule.scheduleJob('0 1 * * *', instrumentJob('form-lock', lockJob, { logger: props.logger }));
  props.logger.info(`Scheduled lock job.`);

  const deleteJob = createDeleteJob(props);
  schedule.scheduleJob('45 1 * * *', instrumentJob('form-delete', deleteJob, { logger: props.logger }));
  props.logger.info(`Scheduled form delete job.`);

  if (props.sharepointService) {
    const retryJob = createSharePointRetryJob({ logger: props.logger, service: props.sharepointService });
    schedule.scheduleJob(
      SHAREPOINT_RETRY_SCHEDULE,
      instrumentJob('form-sharepoint-retry', retryJob, { logger: props.logger }),
    );
    props.logger.info(`Scheduled SharePoint push retry job.`);
  }
};
