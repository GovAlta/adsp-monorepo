import { Job } from 'node-schedule';
import { Logger } from 'winston';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EventService } from '@abgov/adsp-service-sdk';
import { HealthCheckJobCache } from './HealthCheckJobCache';
import { HealthCheckJob } from './HealthCheckJob';
import { ServiceStatusApplicationEntity } from '../model';
import { getScheduler } from './SchedulerFactory';

export interface HealthCheckSchedulingProps {
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
    scheduleHealthChecks: JobScheduler,
    scheduleDataReset: () => Promise<void>,
    scheduleCacheReload: () => Promise<void>
  ): Promise<void> => {
    const applications = await this.#props.serviceStatusRepository.findEnabledApplications();
    this.#jobCache.addBatch(applications, scheduleHealthChecks);
    scheduleCacheReload();
    scheduleDataReset();
  };

  startHealthChecks = (app: ServiceStatusApplicationEntity, scheduler: JobScheduler): void => {
    if (!this.#jobCache.exists(app._id)) {
      this.#jobCache.add(app, scheduler);
      this.#logger.info(`Added job for url: ${app.endpoint.url}`);
    } else {
      this.#logger.warn(`Asked to start a job already in the cache #${app._id}`);
    }
  };

  stopHealthChecks = (applicationId: string, cancelJob: (job: HealthCheckJob) => void = (j) => j.cancel()): void => {
    if (this.#jobCache.exists(applicationId)) {
      this.#jobCache.remove(applicationId, cancelJob);
      this.#logger.info(`Cancelled job #${applicationId}`);
    } else {
      this.#logger.warn(`Asked to stop a job that isn't in the cache #${applicationId}`);
    }
  };

  // FIXME
  // We can get rid of this method all together by handling update and delete health check jobs
  // in the HealthCheckController.
  reloadCache = (applications: ServiceStatusApplicationEntity[]): void => {
    this.#logger.info(`Sync Job queue with database`);
    const cachedIds = this.#jobCache.getApplicationIds();
    const idsToRemove = [];
    const idsToAdd = [];
    const storedIds = applications.map((app) => {
      return app._id.toString();
    });

    for (const app of applications) {
      const id = app._id.toString();

      if (cachedIds.includes(id)) {
        // Update: kill it and add it back, in case the URL has changed.
        idsToRemove.push(id);
        idsToAdd.push(id);
      } else {
        // New Application
        idsToAdd.push(id);
      }
    }

    for (const cachedId of cachedIds) {
      // Deleted or disabled app
      if (!storedIds.includes(cachedId)) {
        idsToRemove.push(cachedId);
      }
    }

    // Update -> delete first;
    idsToRemove.forEach((id) => {
      this.#jobCache.remove(id);
    });

    // then add back.
    const appsToAdd = applications.filter((app) => {
      return idsToAdd.includes(app._id.toString());
    });
    this.#jobCache.addBatch(appsToAdd, getScheduler(this.#props));
  };
}
