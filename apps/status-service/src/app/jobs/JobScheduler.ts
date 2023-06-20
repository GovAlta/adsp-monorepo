import { Job } from 'node-schedule';
import { Logger } from 'winston';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EventService,   ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { HealthCheckJobCache } from './HealthCheckJobCache';
import { HealthCheckJob } from './HealthCheckJob';
import { getScheduler } from './SchedulerFactory';
import { ApplicationManager } from '../model/applicationManager';
import { StaticApplicationData } from '../model';
import { StatusApplications } from '../model/statusApplications';

export interface HealthCheckSchedulingProps {
  logger: Logger;
  serviceStatusRepository: ServiceStatusRepository;
  eventService: EventService;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  applicationManager: ApplicationManager;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}
export interface JobScheduler {
  schedule: (StaticApplicationData) => Job;
}
export class HealthCheckJobScheduler {
  #props: HealthCheckSchedulingProps;
  #appManager: ApplicationManager;
  #jobCache: HealthCheckJobCache;
  #logger: Logger;

  constructor(props: HealthCheckSchedulingProps) {
    this.#props = props;
    this.#appManager = props.applicationManager;
    this.#logger = props.logger;
    this.#jobCache = new HealthCheckJobCache(props.logger);
  }

  loadHealthChecks = async (
    scheduleHealthChecks: JobScheduler,
    scheduleDataReset: () => Promise<void>,
    scheduleCacheReload: () => Promise<void>
  ): Promise<void> => {
    const applications = await this.#appManager.findEnabledApps();
    this.#jobCache.addBatch(applications, scheduleHealthChecks);
    scheduleCacheReload();
    scheduleDataReset();
  };

  startHealthChecks = (app: StaticApplicationData, scheduler: JobScheduler): void => {
    if (!this.#jobCache.exists(app.appKey)) {
      this.#jobCache.add(app, scheduler);
      this.#logger.info(`Added job for url: ${app.url}`);
    } else {
      this.#logger.warn(`Asked to start a job already in the cache #${app.appKey}`);
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
  reloadCache = async (appManager: ApplicationManager): Promise<void> => {
    const apps = await appManager.findEnabledApps();
    const cachedIds = this.#jobCache.getApplicationIds();
    const idsToRemove = [];
    const idsToAdd = [];
    const storedIds = apps.map((a): string => {
      return a.appKey;
    });

    for (const app of apps) {
      if (cachedIds.includes(app.appKey)) {
        // Update: kill it and add it back, in case the URL has changed.
        idsToRemove.push(app.appKey);
        idsToAdd.push(app.appKey);
      } else {
        // New Application
        idsToAdd.push(app.appKey);
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
    const appsToAdd = apps.filter((app) => {
      return idsToAdd.includes(app.appKey);
    });
    this.#jobCache.addBatch(StatusApplications.fromArray(appsToAdd), getScheduler(this.#props));
  };
}
