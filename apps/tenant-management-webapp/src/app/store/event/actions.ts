import type { EventDefinition, EventLogEntry, EventMetrics, EventSearchCriteria } from './models';

export const FETCH_EVENT_DEFINITIONS_ACTION = 'event/FETCH_EVENT_DEFINITIONS_ACTION';
export const FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION = 'event/FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION';
export const DELETE_EVENT_DEFINITION_ACTION = 'event/DELETE_EVENT_DEFINITION_ACTION';
export const DELETE_EVENT_DEFINITION_SUCCESS_ACTION = 'event/DELETE_EVENT_DEFINITION_SUCCESS_ACTION';

export const UPDATE_EVENT_DEFINITION_ACTION = 'event/UPDATE_EVENT_DEFINITION_ACTION';
export const UPDATE_EVENT_DEFINITION_SUCCESS_ACTION = 'event/UPDATE_EVENT_DEFINITION_SUCCESS_ACTION';

export const FETCH_EVENT_LOG_ENTRIES_ACTION = 'eventLog/FETCH_EVENT_LOG_ENTRIES_ACTION';
export const FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION = 'eventLog/FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION';

export const CLEAR_EVENT_LOG_ENTRIES_SUCCESS_ACTION = 'eventLog/CLEAR_EVENT_LOG_ENTRIES_SUCCESS_ACTION';

export const FETCH_EVENT_METRICS_ACTION = 'event/FETCH_EVENT_METRICS_ACTION';
export const FETCH_EVENT_METRICS_SUCCESS_ACTION = 'event/FETCH_EVENT_METRICS_SUCCESS_ACTION';

export interface FetchEventDefinitionsAction {
  type: typeof FETCH_EVENT_DEFINITIONS_ACTION;
}

export interface FetchEventDefinitionsSuccessAction {
  type: typeof FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION;
  results: EventDefinition[];
}

export interface DeleteEventDefinitionAction {
  type: typeof DELETE_EVENT_DEFINITION_ACTION;
  definition: EventDefinition;
}

export interface DeleteEventDefinitionSuccessAction {
  type: typeof DELETE_EVENT_DEFINITION_SUCCESS_ACTION;
  definition: EventDefinition;
}

export interface UpdateEventDefinitionAction {
  type: typeof UPDATE_EVENT_DEFINITION_ACTION;
  definition: EventDefinition;
}

export interface UpdateEventDefinitionSuccessAction {
  type: typeof UPDATE_EVENT_DEFINITION_SUCCESS_ACTION;
  definition: EventDefinition;
}

export interface FetchEventLogEntriesAction {
  type: typeof FETCH_EVENT_LOG_ENTRIES_ACTION;
  after: string;
  searchCriteria: EventSearchCriteria;
}

export interface FetchEventLogEntriesSuccessAction {
  type: typeof FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION;
  entries: EventLogEntry[];
  after: string;
  next: string;
}

export interface ClearEventLogEntriesSuccessAction {
  type: typeof CLEAR_EVENT_LOG_ENTRIES_SUCCESS_ACTION;
}

export interface FetchEventMetricsAction {
  type: typeof FETCH_EVENT_METRICS_ACTION;
}

export interface FetchEventMetricsSuccessAction {
  type: typeof FETCH_EVENT_METRICS_SUCCESS_ACTION;
  metrics: EventMetrics;
}

export type EventActionTypes =
  | FetchEventDefinitionsAction
  | FetchEventDefinitionsSuccessAction
  | DeleteEventDefinitionAction
  | DeleteEventDefinitionSuccessAction
  | UpdateEventDefinitionAction
  | UpdateEventDefinitionSuccessAction
  | FetchEventLogEntriesAction
  | FetchEventLogEntriesSuccessAction
  | ClearEventLogEntriesSuccessAction
  | FetchEventMetricsAction
  | FetchEventMetricsSuccessAction;

export const getEventDefinitions = (): FetchEventDefinitionsAction => ({
  type: FETCH_EVENT_DEFINITIONS_ACTION,
});

export const getEventDefinitionsSuccess = (results: EventDefinition[]): FetchEventDefinitionsSuccessAction => ({
  type: FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION,
  results,
});

export const deleteEventDefinition = (definition: EventDefinition): DeleteEventDefinitionAction => ({
  type: DELETE_EVENT_DEFINITION_ACTION,
  definition,
});

export const deleteEventDefinitionSuccess = (definition: EventDefinition): DeleteEventDefinitionSuccessAction => ({
  type: DELETE_EVENT_DEFINITION_SUCCESS_ACTION,
  definition,
});

export const updateEventDefinition = (definition: EventDefinition): UpdateEventDefinitionAction => ({
  type: UPDATE_EVENT_DEFINITION_ACTION,
  definition,
});

export const updateEventDefinitionSuccess = (definition: EventDefinition): UpdateEventDefinitionSuccessAction => ({
  type: UPDATE_EVENT_DEFINITION_SUCCESS_ACTION,
  definition,
});

export const getEventLogEntries = (
  after?: string,
  searchCriteria?: EventSearchCriteria
): FetchEventLogEntriesAction => ({
  type: FETCH_EVENT_LOG_ENTRIES_ACTION,
  after,
  searchCriteria,
});

export const getEventLogEntriesSucceeded = (
  results: {
    context: Record<string, string>;
    timestamp: string;
    correlationId: string;
    value: { payload: Record<string, unknown> };
  }[],
  after: string,
  next: string
): FetchEventLogEntriesSuccessAction => ({
  type: FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION,
  entries: results.map(({ context, timestamp, correlationId, value }) => ({
    namespace: context.namespace,
    name: context.name,
    timestamp: new Date(timestamp),
    correlationId,
    details: value.payload,
  })),
  after,
  next,
});

export const clearEventLogEntries = (): ClearEventLogEntriesSuccessAction => ({
  type: CLEAR_EVENT_LOG_ENTRIES_SUCCESS_ACTION,
});

export const fetchEventMetrics = (): FetchEventMetricsAction => ({
  type: FETCH_EVENT_METRICS_ACTION,
});

export const fetchEventMetricsSucceeded = (metrics: EventMetrics): FetchEventMetricsSuccessAction => ({
  type: FETCH_EVENT_METRICS_SUCCESS_ACTION,
  metrics,
});
