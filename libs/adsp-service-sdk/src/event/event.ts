import { AdspId } from '../utils';

export interface DomainEvent {
  name: string;
  timestamp: Date;
  correlationId?: string;
  tenantId: AdspId;
  context?: {
    [key: string]: boolean | number | string;
  };
  payload: { [key: string]: unknown };
}

export interface DomainEventDefinition {
  name: string;
  description: string;
  payloadSchema: Record<string, unknown>;
  interval?: {
    metric: string;
    namespace: string;
    name: string;
  };
}
