import axios from 'axios';
import { scheduleJob, Job } from 'node-schedule';
import { Logger } from 'winston';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { createCheckEndpointJob, CreateCheckEndpointProps } from './checkEndpoint';
import { EventService } from '@abgov/adsp-service-sdk';
import { HealthCheckJob, HealthCheckJobCache } from './HealthCheckJobCache';
import { ServiceStatusApplicationEntity } from '../model';

const JOB_TIME_INTERVAL_MIN = 1;
const REQUEST_TIMEOUT = 5000;
interface HealthCheckSchedulingProps {
  logger: Logger;
  serviceStatusRepository: ServiceStatusRepository;
  eventService: EventService;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
}

export interface JobScheduler {
  schedule: (applicationId: string, url: string) => Job;
}
export class HealthCheckJobScheduler {
  #props: HealthCheckSchedulingProps;
  #jobCache: HealthCheckJobCache;
  #logger: Logger;

  constructor(props: HealthCheckSchedulingProps) {
    this.#props = props;
    this.#logger = props.logger;
    this.#jobCache = new HealthCheckJobCache(props.logger);
  }

  loadHealthChecks = async (
    scheduleHealthChecks: (job: HealthCheckJob) => void,
    scheduleDataReset: () => Promise<void>,
    scheduleCacheReload: () => Promise<void>
  ): Promise<void> => {
    this.#logger.info('Scheduling endpoint checks...');

    // start enabled apps
    const applications = await this.#props.serviceStatusRepository.findEnabledApplications();
    this.#jobCache.addBatch(applications);
    this.#jobCache.updateJobs(scheduleHealthChecks);

    scheduleCacheReload();
    scheduleDataReset();
  };

  startHealthChecks = (
    app: ServiceStatusApplicationEntity,
    scheduler: (job: HealthCheckJob) => void = this.scheduleJob
  ): void => {
    const job = this.#jobCache.add(app);
    this.#jobCache.updateJob(job, scheduler);
  };

  stopHealthChecks = (
    applicationId: string,
    cancelJob: (job: HealthCheckJob) => void = (j) => j.job?.cancel()
  ): void => {
    if (this.#jobCache.exists(applicationId)) {
      this.#jobCache.remove(applicationId, cancelJob);
    }
  };

  #scheduler: JobScheduler = {
    schedule: (applicationId: string, url: string): Job => {
      const cceProps: CreateCheckEndpointProps = {
        ...this.#props,
        applicationId: applicationId,
        url: url,
        getEndpointResponse: async (url: string) => {
          return await axios.get(url, { timeout: REQUEST_TIMEOUT });
        },
      };
      const job = createCheckEndpointJob(cceProps);
      this.#logger.info(`scheduling job for ${applicationId}`);
      return scheduleJob(`*/${JOB_TIME_INTERVAL_MIN} * * * *`, job);
    },
  };

  scheduleJob = (job: HealthCheckJob): void => {
    if (!job.job) {
      job.job = this.#scheduler.schedule(job.applicationId, job.url);
      this.#logger.info(`Add job definition for ${job.url}`);
    }
  };

  // FIXME
  // We can get rid of this method all together by handling update and delete health check jobs
  // in the HealthCheckController.
  reloadCache = (applications: ServiceStatusApplicationEntity[]): void => {
    this.#logger.info(`Sync Job queue with database`);
    const ids = this.#jobCache.getApplicationIds();
    const idsToRemove = [];
    const idsToAdd = [];
    const newIds = applications.map((app) => {
      return app._id.toString();
    });

    for (const app of applications) {
      const id = app._id.toString();

      if (ids.includes(id)) {
        // Update: kill it and add it back, in case the URL has changed.
        idsToRemove.push(id);
        idsToAdd.push(id);
      } else {
        // New Application
        idsToAdd.push(id);
      }
    }

    for (const _id of ids) {
      // Deleted or disabled app
      if (!newIds.includes(_id)) {
        idsToRemove.push(_id);
      }
    }

    // Update -> delete first, then add back.
    idsToRemove.forEach((id) => {
      this.#logger.info(`Remove application with id ${id} from queue.`);
      this.stopHealthChecks(id);
    });

    const appsToAdd = applications.filter((app) => {
      return idsToAdd.includes(app._id.toString());
    });
    this.#jobCache.addBatch(appsToAdd);
    this.#jobCache.updateJobs(this.scheduleJob);
  };
}
