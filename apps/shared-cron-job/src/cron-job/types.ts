import { AdspId } from '@abgov/adsp-service-sdk';

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
}
