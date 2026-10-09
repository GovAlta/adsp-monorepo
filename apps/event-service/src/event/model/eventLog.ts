import type { AdspId } from '@abgov/adsp-service-sdk';

export interface EventLogCriteria {
  namespace?: string;
  name?: string;
  timestampMin?: Date;
  timestampMax?: Date;
  correlationId?: string;
}

//This count response maps to the response data coming from the value service
export interface EventLogCountResponse {
  count: number;
  namespace: string;
  name: string;
}
