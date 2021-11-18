import axios from 'axios';
import { scheduleJob, Job } from 'node-schedule';
import { Logger } from 'winston';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { createCheckEndpointJob, CreateCheckEndpointProps } from './checkEndpoint';
import { EventService } from '@abgov/adsp-service-sdk';
import { HealthCheckJobs } from './healthCheckJobs';
const JOB_TIME_INTERVAL_MIN = 1;
interface ServiceStatusJobProps {
  logger: Logger;
  serviceStatusRepository: ServiceStatusRepository;
  eventService: EventService;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
}

function scheduleServiceStatusJob(props: CreateCheckEndpointProps): Job {
  const job = createCheckEndpointJob(props);
  return scheduleJob(`* */${JOB_TIME_INTERVAL_MIN} * * *`, job);
}

export async function scheduleServiceStatusJobs(props: ServiceStatusJobProps): Promise<void> {
  props.logger.info('Scheduling endpoint checks...');

  // start enabled apps
  const applications = await props.serviceStatusRepository.findEnabledApplications();
  const healthCheckJobs = new HealthCheckJobs(props.logger);
  healthCheckJobs.addBatch(applications);
  healthCheckJobs.forEach((url): Job => {
    return scheduleServiceStatusJob({
      ...props,
      url,
      getter: async (url: string) => {
        return await axios.get(url);
      },
    });
  });

  scheduleJob('* */5 * * *', watchApps(props));
  scheduleJob('* * */1 * *', deleteOldStatus(props));

}

function deleteOldStatus(props: ServiceStatusJobProps) {
  return async () => {
    props.logger.info("Start to delete the old application status.")
    await props.endpointStatusEntryRepository.deleteOldUrlStatus();
    props.logger.info("Completed the old application status deletion.")
  }
}

// *******
// Private
// *******
function watchApps(props: ServiceStatusJobProps) {
  return async () => {
    const applications = await props.serviceStatusRepository.findEnabledApplications();
    const healthCheckJobs = new HealthCheckJobs(props.logger);
    await healthCheckJobs.sync(applications, (url) => {
      return scheduleServiceStatusJob({
        ...props,
        url,
        getter: async (url: string) => {
          return await axios.get(url);
        },
      });
    });
  };
}