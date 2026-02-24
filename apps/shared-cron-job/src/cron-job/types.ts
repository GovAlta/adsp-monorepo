import { AdspId } from '@abgov/adsp-service-sdk';
import { Job } from 'node-schedule';

export interface CronJobConfig {
  id: string;
  name?: string;
  description?: string;
  webhook?: string;
  schedule: string;
}
export interface CronJob extends CronJobConfig {
  isLoaded: boolean;
  tenantId: AdspId;
  job?: Job;
}
