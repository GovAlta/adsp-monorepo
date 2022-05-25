import { IntervalDefinition } from '@abgov/adsp-service-sdk';

export interface EventDefinition {
  name: string;
  description: string;
  payloadSchema: Record<string, unknown>;
  interval?: IntervalDefinition;
}
