import { adspId } from '@abgov/adsp-service-sdk';

export interface MetricsResponse {
  [key: string]: {
    name: string;
    values: {
      interval: string;
      sum: string;
      avg: string;
      min: string;
      max: string;
      count: string;
    }[];
  };
}

export interface Metrics {
  interval: string;
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

export const CACHE_SERVICE_ID = adspId`urn:ads:platform:cache-service:v1`;
export const VALUE_SERVICE_ID = adspId`urn:ads:platform:value-service:v1`;
