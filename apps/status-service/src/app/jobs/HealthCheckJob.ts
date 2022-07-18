import { Job } from 'node-schedule';
import { JobScheduler } from './JobScheduler';

export class HealthCheckJob {
  #url: string;
  #applicationId: string;
  #action?: Job;

  constructor(url: string, applicationId: string) {
    this.#url = url;
    this.#applicationId = applicationId;
    this.#action = null;
  }

  getUrl = (): string => {
    return this.#url;
  };

  isScheduled = (): boolean => {
    return this.#action !== null;
  };
  schedule = (scheduler: JobScheduler): void => {
    this.#action = scheduler.schedule(this.#applicationId, this.#url);
  };
  cancel = (): void => {
    if (this.#action !== null) {
      this.#action.cancel();
      this.#action = null;
    }
  };
}
