import { Job } from 'node-schedule';
import { StaticApplicationData } from '../model';
import { JobScheduler } from './JobScheduler';

export class HealthCheckJob {
  #app: StaticApplicationData;
  #action?: Job;

  constructor(app: StaticApplicationData) {
    this.#app = app;
    this.#action = null;
  }

  getUrl = (): string => {
    return this.#app.url;
  };

  isScheduled = (): boolean => {
    return this.#action !== null;
  };
  schedule = (scheduler: JobScheduler): void => {
    this.#action = scheduler.schedule(this.#app);
  };
  cancel = (): void => {
    if (this.#action !== null) {
      this.#action.cancel();
      this.#action = null;
    }
  };
}
