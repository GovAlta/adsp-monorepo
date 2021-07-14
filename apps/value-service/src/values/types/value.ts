import { AdspId } from '@abgov/adsp-service-sdk';

export interface Value {
  timestamp: Date;
  correlationId: string;
  tenantId: AdspId;
  context: Record<string, boolean | string | number>;
  value: unknown;
  metrics?: Record<string, number>;
}

export interface ValueCriteria {
  namespace?: string;
  name?: string;
  tenantId?: AdspId;
  timestampMin?: Date;
  timestampMax?: Date;
  correlationId?: string;
  context?: Record<string, boolean | string | number>;
}

export const VALUES_READ = 'READ';
export interface ValuesReadRequest {
  op: typeof VALUES_READ;
  values: {
    [value: string]: {
      criteria?: ValueCriteria;
    };
  };
}

export const VALUES_WRITE = 'WRITE';
export interface ValuesWriteRequest {
  op: typeof VALUES_WRITE;
  values: {
    [value: string]: Value;
  };
}
