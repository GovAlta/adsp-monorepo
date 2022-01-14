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
  details: Record<string, unknown>;
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
}

export interface EventSearchCriteria {
  timestampMax: string;
  timestampMin: string;
  namespace: string;
  name: string;
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
