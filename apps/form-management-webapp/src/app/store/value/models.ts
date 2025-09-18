import { GoADate } from '@abgov/react-components';

export interface ValueDefinition {
  isCore: boolean;
  namespace: string;
  name: string;
  description: string;
  jsonSchema: Record<string, unknown>;
}

export interface ValueLogEntry {
  namespace: string;
  name: string;
  timestamp: Date;
  correlationId?: string;
  details: Record<string, unknown>;
}

export interface ValueMetrics {
  totalValues?: number;
  avgPerDay?: number;
}

export interface ValueState {
  definitions: Record<string, ValueDefinition>;
  results: string[];
  entries: ValueLogEntry[];
  nextEntries: string;
  isLoading: {
    definitions: boolean;
    log: boolean;
  };
  metrics: ValueMetrics;
}

export interface ValueSearchCriteria {
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

export interface ValueSearchCriteriaGoA {
  timestampMax?: GoADate;
  timestampMin?: GoADate;
  namespace?: string;
  name?: string;
  correlationId?: string;
  url?: string;
  applications?: string;
  value?: string;
  top?: number;
}

export const defaultValueDefinition: ValueDefinition = {
  isCore: false,
  namespace: '',
  name: '',
  description: '',
  jsonSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: true,
  },
};
