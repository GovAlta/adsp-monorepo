import { AdspId } from '@abgov/adsp-service-sdk';
import { Job } from 'node-schedule';

export interface TriggerEvent {
  name: string;
  namespace: string;
  payload?: { [key: string]: unknown };
}
export interface CronJobConfig {
  id: string;
  name?: string;
  description?: string;
  webhook?: string;
  schedule: string;
  triggerEvents?: TriggerEvent[];
}
export interface CronJob extends CronJobConfig {
  isLoaded: boolean;
  tenantId: AdspId;
  job?: Job;
}
