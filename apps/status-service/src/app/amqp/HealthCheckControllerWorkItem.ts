import { AdspId } from '@abgov/adsp-service-sdk';

export type HealthCheckControllerJobType = 'start' | 'stop';
export interface HealthCheckControllerWorkItem {
  work: HealthCheckControllerJobType;
  url: string;
  applicationId: string;
  timestamp: Date;
  tenantId: AdspId;
}
