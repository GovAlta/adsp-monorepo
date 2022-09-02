import * as NodeCache from 'node-cache';
import { ApplicationData, ServiceStatusApplicationEntity } from '..';
import { Logger } from 'winston';
import { HealthCheckJob } from './HealthCheckJob';
import { JobScheduler } from './JobScheduler';
import { ApplicationList } from '../model/ApplicationList';

export class HealthCheckJobCache {
  static #activeHealthChecks = new NodeCache();
  #logger: Logger;

  constructor(logger: Logger) {
    this.#logger = logger;
  }

  getApplicationIds = (): string[] => {
    return HealthCheckJobCache.#activeHealthChecks.keys();
  };

  exists = (key: string): boolean => {
    return HealthCheckJobCache.#activeHealthChecks.has(key);
  };

  get = (key: string): HealthCheckJob => {
    return HealthCheckJobCache.#activeHealthChecks.get(key);
  };

  addBatch = (applications: ApplicationList, scheduler: JobScheduler): void => {
    applications.forEach((app) => {
      this.add(app._id, app.url, scheduler);
    });
  };

  add = (appId: string, url: string, scheduler: JobScheduler): HealthCheckJob => {
    const job: HealthCheckJob = new HealthCheckJob(url, appId);
    HealthCheckJobCache.#activeHealthChecks.set(appId, job);
    job.schedule(scheduler);
    this.#logger.info(`Job Cache: scheduled app with url ${job.getUrl()}`);
    return job;
  };

  remove = (key: string, cancel: (job: HealthCheckJob) => void = (j) => j.cancel()): void => {
    const value = HealthCheckJobCache.#activeHealthChecks.take<HealthCheckJob>(key);
    if (value) {
      cancel(value);
      this.#logger.info(`Deleted job with url ${value.getUrl()}`);
    }
  };

  clear = (cancelJob: (job: HealthCheckJob) => void): void => {
    const keys = HealthCheckJobCache.#activeHealthChecks.keys();
    keys.forEach((key) => this.remove(key, cancelJob));
  };
}
