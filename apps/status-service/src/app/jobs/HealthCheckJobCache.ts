import * as NodeCache from 'node-cache';
import { ServiceStatusApplicationEntity } from '..';
import { Logger } from 'winston';
import { Job } from 'node-schedule';

export interface HealthCheckJob {
  url: string;
  applicationId: string;
  job?: Job;
  isScheduled: () => boolean;
}

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
    return HealthCheckJobCache.#activeHealthChecks.get(key);
  };

  get = (key: string): HealthCheckJob => {
    return HealthCheckJobCache.#activeHealthChecks.get(key);
  };

  addBatch = (applications: ServiceStatusApplicationEntity[]): void => {
    for (const application of applications) {
      this.add(application);
    }
  };

  add = (application: ServiceStatusApplicationEntity): HealthCheckJob => {
    let job: HealthCheckJob = undefined;
    const key = application._id.toString();

    this.#logger.info(`Create a new job with application id ${key}.`);
    job = {
      url: application.endpoint.url,
      applicationId: key,
      job: null,
      isScheduled: () => {
        return job !== null;
      },
    };

    HealthCheckJobCache.#activeHealthChecks.set(key, job);
    this.#logger.info(`added application #${key} to cache`);
    return job;
  };

  updateJobs = (update: (job: HealthCheckJob) => void): void => {
    const keys = HealthCheckJobCache.#activeHealthChecks.keys();
    keys.forEach((key) => {
      const job = HealthCheckJobCache.#activeHealthChecks.get(key) as HealthCheckJob;
      this.updateJob(job, update);
      HealthCheckJobCache.#activeHealthChecks.set(key, job);
    });
  };

  updateJob = (job: HealthCheckJob, update: (job: HealthCheckJob) => void): void => {
    update(job);
  };

  remove = (key: string, preprocess: (job: HealthCheckJob) => void): void => {
    const value = HealthCheckJobCache.#activeHealthChecks.get(key);
    if (value) {
      const healthCheck = value as HealthCheckJob;
      preprocess(healthCheck);
      HealthCheckJobCache.#activeHealthChecks.del(key);
      this.#logger.info(`Delete job with url ${healthCheck.url}`);
    }
  };

  clear = (preprocess: (job: HealthCheckJob) => void): void => {
    const keys = HealthCheckJobCache.#activeHealthChecks.keys();
    keys.forEach((key) => this.remove(key, preprocess));
  };
}
