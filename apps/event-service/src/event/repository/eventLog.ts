import type { AdspId } from '@abgov/adsp-service-sdk';

export interface EventLogCriteria {
  namespace?: string;
  name?: string;
  timestampMin?: Date;
  timestampMax?: Date;
  correlationId?: string;
}

export interface EventLogRepository {
  countEvents(tenantId: AdspId, criteria: EventLogCriteria): Promise<number>;
}
