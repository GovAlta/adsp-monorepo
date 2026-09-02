import { Logger } from 'winston';
import * as schedule from 'node-schedule';
import { FormRepository } from '../repository';
import { createDeleteJob } from './delete';
import { createLockJob } from './lock';
import { AdspId, EventService, instrumentJob } from '@abgov/adsp-service-sdk';
import { FileService } from '../../file';
import { NotificationService } from '../../notification';

interface FormJobProps {
  apiId: AdspId;
  logger: Logger;
  repository: FormRepository;
  eventService: EventService;
  fileService: FileService;
  notificationService: NotificationService;
}

export const scheduleFormJobs = (props: FormJobProps): void => {
  const lockJob = createLockJob(props);
  schedule.scheduleJob('0 1 * * *', instrumentJob('form-lock', lockJob, { logger: props.logger }));
  props.logger.info(`Scheduled lock job.`);

  const deleteJob = createDeleteJob(props);
  schedule.scheduleJob('45 1 * * *', instrumentJob('form-delete', deleteJob, { logger: props.logger }));
  props.logger.info(`Scheduled form delete job.`);
};
