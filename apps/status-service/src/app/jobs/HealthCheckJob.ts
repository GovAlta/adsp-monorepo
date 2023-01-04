import { AdspId } from '@abgov/adsp-service-sdk';
import { Job } from 'node-schedule';
import { StaticApplicationData } from '../model';
import { JobScheduler } from './JobScheduler';

export class HealthCheckJob {
  #app: StaticApplicationData;
  #action?: Job;
  #tenantId: AdspId;

  constructor(app: StaticApplicationData, tenantId: AdspId) {
    this.#app = app;
    this.#action = null;
    this.#tenantId = tenantId;
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
