import { Logger } from 'winston';
import * as schedule from 'node-schedule';
import { FormRepository } from '../repository';
import { createDeleteJob } from './delete';
import { createLockJob } from './lock';
import { EventService } from '@abgov/adsp-service-sdk';

interface FormJobProps {
  logger: Logger;
  repository: FormRepository;
  eventService: EventService;
}

export const scheduleFormJobs = (props: FormJobProps): void => {
  const lockJob = createLockJob(props);
  schedule.scheduleJob('0 */1 * * *', lockJob);
  props.logger.info(`Scheduled lock job.`);

  const deleteJob = createDeleteJob(props);
  schedule.scheduleJob('15 */1 * * *', deleteJob);
  props.logger.info(`Scheduled form delete job.`);
};
