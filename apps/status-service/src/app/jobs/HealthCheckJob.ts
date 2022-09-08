import { Job } from 'node-schedule';
import { JobScheduler } from './JobScheduler';

export class HealthCheckJob {
  #url: string;
  #applicationId: string;
  #name: string;
  #action?: Job;

  constructor(name: string, url: string, applicationId: string) {
    this.#url = url;
    this.#applicationId = applicationId;
    this.#action = null;
    this.#name = name;
  }

  getUrl = (): string => {
    return this.#url;
  };

  isScheduled = (): boolean => {
    return this.#action !== null;
  };
  schedule = (scheduler: JobScheduler): void => {
    this.#action = scheduler.schedule(this.#applicationId, this.#name, this.#url);
  };
  cancel = (): void => {
    if (this.#action !== null) {
      this.#action.cancel();
      this.#action = null;
    }
  };
}
