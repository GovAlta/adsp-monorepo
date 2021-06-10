import { scheduleJob, Job } from 'node-schedule';
import { Logger } from 'winston';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { createCheckEndpointJob, CreateCheckEndpointProps } from './checkEndpoint';
import {
  fetchNonQueuedApplications,
  fetchQueuedDeletedApplications,
  fetchQueuedDisabledApplications,
} from './watchApplications';

interface ServiceStatusJobProps {
  logger: Logger;
  serviceStatusRepository: ServiceStatusRepository;
}

// TODO: determine if the `scheduledJobs` property within the node-schedule, can also work
const scheduledJobs = new Map<string, Job>();

export async function scheduleServiceStatusJobs(props: ServiceStatusJobProps): Promise<void> {
  props.logger.info('Scheduling endpoint checks...');

  // start enabled apps
  const applications = await props.serviceStatusRepository.findEnabledApplications();
  applications.forEach(async (application) => {
    scheduleServiceStatusJob({ ...props, application });
  });

  scheduleJob('* */1 * * *', watchApps(props));
}

// *******
// Private
// *******

function watchApps(props: ServiceStatusJobProps) {
  return async () => {
    await watchForDeletedApps(props);
    await watchForDeactivatedApps(props);
    await watchForActivatedApps(props);
  };
}

async function watchForDeletedApps(props: ServiceStatusJobProps) {
  const deletedAppIds = await fetchQueuedDeletedApplications({ ...props, scheduledJobs });
  props.logger.info(`${deletedAppIds.length} deleted apps found`);
  deletedAppIds.forEach((applicationId) => {
    unscheduleServiceStatusJob(applicationId);
  });
}

async function watchForDeactivatedApps(props: ServiceStatusJobProps) {
  const disabledApps = await fetchQueuedDisabledApplications({ ...props, scheduledJobs });
  props.logger.info(`${disabledApps.length} disabled apps found`);
  disabledApps.forEach((application) => {
    unscheduleServiceStatusJob(application.id);
  });
}

async function watchForActivatedApps(props: ServiceStatusJobProps) {
  const nonQueuedApps = await fetchNonQueuedApplications({ ...props, scheduledJobs });
  props.logger.info(`${nonQueuedApps.length} non-queued apps found`);
  nonQueuedApps.forEach((application) => {
    scheduleServiceStatusJob({ ...props, application });
  });
}

function scheduleServiceStatusJob(props: CreateCheckEndpointProps) {
  const job = createCheckEndpointJob(props);
  const scheduledJob = scheduleJob(`* */${props.application.timeIntervalMin} * * *`, job);

  scheduledJobs[props.application.id] = scheduledJob;
}

function unscheduleServiceStatusJob(applicationId: string): boolean {
  const job = scheduledJobs[applicationId];
  delete scheduledJobs[applicationId];
  return job.cancel();
}
