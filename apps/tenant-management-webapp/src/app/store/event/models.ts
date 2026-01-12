import { GoabDate } from '@abgov/ui-components-common';

export interface EventDefinition {
  isCore: boolean;
  namespace: string;
  name: string;
  description: string;
  payloadSchema: Record<string, unknown>;
}

export interface EventLogEntry {
  namespace: string;
  name: string;
  timestamp: Date;
  correlationId?: string;
  details: Record<string, unknown>;
}

export interface EventMetrics {
  totalEvents?: number;
  avgPerDay?: number;
}

export interface EventState {
  definitions: Record<string, EventDefinition>;
  results: string[];
  entries: EventLogEntry[];
  nextEntries: string;
  isLoading: {
    definitions: boolean;
    log: boolean;
  };
  metrics: EventMetrics;
}

export interface EventSearchCriteria {
  timestampMax?: string;
  timestampMin?: string;
  context?: Record<string, unknown>;
  namespace?: string;
  name?: string;
  correlationId?: string;
  url?: string;
  applications?: string;
  value?: string;
  top?: number;
}

export interface EventSearchCriteriaGoA {
  timestampMax?: GoabDate;
  timestampMin?: GoabDate;
  namespace?: string;
  name?: string;
  correlationId?: string;
  url?: string;
  applications?: string;
  value?: string;
  top?: number;
}

export const defaultEventDefinition: EventDefinition = {
  isCore: false,
  namespace: '',
  name: '',
  description: '',
  payloadSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: true,
  },
};
