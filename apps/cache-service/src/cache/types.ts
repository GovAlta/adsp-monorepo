import { AdspId } from '@abgov/adsp-service-sdk';

export interface InvalidationEvent {
  namespace: string;
  name: string;
  resourceIdPath: string | string[];
}

export interface Target {
  serviceId: AdspId;
  ttl?: number;
  invalidationEvents?: InvalidationEvent[];
}

export interface CachedResponse {
  headers: Record<string, string | string[]>;
  content: Buffer;
  status: number;
}
