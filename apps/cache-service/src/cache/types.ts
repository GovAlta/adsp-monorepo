import { AdspId } from '@abgov/adsp-service-sdk';

export interface Target {
  serviceId: AdspId;
  ttl: number;
}

export interface CachedResponse {
  headers: Record<string, string | string[]>;
  content: Buffer;
  status: number;
}
