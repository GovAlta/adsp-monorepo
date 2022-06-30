import * as NodeCache from 'node-cache';
import { ServiceStatusApplicationEntity } from '..';
import { Logger } from 'winston';
import { Job } from 'node-schedule';

interface HealthCheckJob {
  url: string,
  applicationId: string
  job?: Job
}

type healthCheckJobType = (applicationId: string, url: string) => Job;

const Jobs = new NodeCache();

export class HealthCheckJobs {
  #logger: Logger
  constructor(logger: Logger) {
    this.#logger = logger;
  }

  forEach = (healthCheckJob: healthCheckJobType): void => {
    const keys = Jobs.keys();
    keys.forEach((key) => {
      const job = Jobs.get(key) as HealthCheckJob;
      // If job does not exist, we need to create a new one for the endpoint.
      if (!job.job) {
        const scheduledJob = healthCheckJob(job.applicationId, job.url );

        job.job = scheduledJob;
        this.#logger.info(`Add job definition for ${job.url}`)
        Jobs.set(key, job);
      }
    });
  }

  addBatch = (applications: ServiceStatusApplicationEntity[]): void => {
    for (const application of applications) {
      this.#add(application);
    }
  }

  idByUrl = (url: string): string => {
    const key = url;
    const job = Jobs.get(key)
    if (job) {
      return (job as HealthCheckJob).applicationId;
    }

    return "";
  }

  #add = (application: ServiceStatusApplicationEntity): void => {
    let job: HealthCheckJob = undefined;
    const id = application._id.toString();
    const key = id;
  
    this.#logger.info(`Create a new job with application id ${application._id}.`)
    job = {
      url: application.endpoint.url,
      applicationId: id,
      job: null
    }

    Jobs.set(key, job);
  }

  #applicationIds = (): string[] => {
    const keys = Jobs.keys();
    const applicationIds: string[] = [];

    keys.forEach((key) => {
      const job = Jobs.get(key) as HealthCheckJob;
      applicationIds.push(job.applicationId);
    });

    return applicationIds;
  }

  #key = (id: string): string => {
    const keys = Jobs.keys();
    return keys.find((key) => {
      return (Jobs.get(key) as HealthCheckJob).applicationId === id
    });
  }

  sync = (applications: ServiceStatusApplicationEntity[], healthCheckJob: healthCheckJobType): void => {
    this.#logger.info(`Sync Job queue with database`);
    const ids = this.#applicationIds();
    const idsToRemove = [];
    const idsToAdd = [];
    const newIds = applications.map((app) => { return app._id.toString() });

    for (const app of applications) {

      const url = app.endpoint.url;
      const id = app._id.toString();
      const idInUrl = (Jobs.get(url) as HealthCheckJob)?.applicationId;

      if (ids.includes(id)) {
        if (idInUrl === id) {
          // Condition a; old app moved to a new endpoint
          // Condition b: old app moved to an existing endpoint
          idsToRemove.push(id);
          idsToAdd.push(id);
        }
      } else {
        // New Application
        idsToAdd.push(id);
      }
    }

    for (const _id of ids) {
      // Deleted or disabled app
      if (!newIds.includes(_id)) {
        idsToRemove.push(_id)
      }
    }

    // Update -> delete first, then add back.
    idsToRemove.forEach((id) => {
      this.#logger.info(`Remove application with id ${id} from queue.`);
      this.#remove(id);
    });

    const appsToAdd = applications.filter(
      (app) => { return idsToAdd.includes(app._id.toString()) });
    this.addBatch(appsToAdd);
    this.forEach(healthCheckJob);
  }

  #remove = (id: string): void => {
    const key = this.#key(id);
    const value = Jobs.get(key);
    if (value) {
      const job = value as HealthCheckJob;

      if (job.applicationId === id) {
        this.#logger.info(
          `Delete job with url ${job.url}`);
        if (Jobs.get(key)) {
          this.#logger.info(
            `Cancel for job with url: ${job.url}`);
          (Jobs.get(key) as HealthCheckJob).job.cancel();
          Jobs.del(key)
        }
      }
    }
  }
} 