import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { StaticApplicationData } from '../model';
import { StatusApplications } from '../model/statusApplications';
import { HealthCheckJob } from './HealthCheckJob';
import { JobScheduler } from './JobScheduler';

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

  addBatch = (applications: StatusApplications, scheduler: JobScheduler): void => {
    applications.forEach((app) => {
      this.add(app, scheduler);
    });
  };

  add = (app: StaticApplicationData, scheduler: JobScheduler): HealthCheckJob => {
    const job: HealthCheckJob = new HealthCheckJob(app);
    HealthCheckJobCache.#activeHealthChecks.set(app.appKey, job);
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
