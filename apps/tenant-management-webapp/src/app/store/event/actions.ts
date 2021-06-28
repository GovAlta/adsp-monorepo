import type { EventDefinition, EventLogEntry } from './models';

export const FETCH_EVENT_DEFINITIONS_ACTION = 'event/FETCH_EVENT_DEFINITIONS_ACTION';
export const FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION = 'event/FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION';

export const UPDATE_EVENT_DEFINITION_ACTION = 'event/UPDATE_EVENT_DEFINITION_ACTION';
export const UPDATE_EVENT_DEFINITION_SUCCESS_ACTION = 'event/UPDATE_EVENT_DEFINITION_SUCCESS_ACTION';

export const FETCH_EVENT_LOG_ENTRIES_ACTION = 'eventLog/FETCH_EVENT_LOG_ENTRIES_ACTION';
export const FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION = 'eventLog/FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION';

export interface FetchEventDefinitionsAction {
  type: typeof FETCH_EVENT_DEFINITIONS_ACTION;
}

export interface FetchEventDefinitionsSuccessAction {
  type: typeof FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION;
  results: EventDefinition[];
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
}

export interface FetchEventLogEntriesSuccessAction {
  type: typeof FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION;
  entries: EventLogEntry[];
  after: string;
  next: string;
}

export type EventActionTypes =
  | FetchEventDefinitionsAction
  | FetchEventDefinitionsSuccessAction
  | UpdateEventDefinitionAction
  | UpdateEventDefinitionSuccessAction
  | FetchEventLogEntriesAction
  | FetchEventLogEntriesSuccessAction;

export const getEventDefinitions = (): FetchEventDefinitionsAction => ({
  type: FETCH_EVENT_DEFINITIONS_ACTION,
});

export const getEventDefinitionsSuccess = (results: EventDefinition[]): FetchEventDefinitionsSuccessAction => ({
  type: FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION,
  results,
});

export const updateEventDefinition = (definition: EventDefinition): UpdateEventDefinitionAction => ({
  type: UPDATE_EVENT_DEFINITION_ACTION,
  definition,
});

export const updateEventDefinitionSuccess = (definition: EventDefinition): UpdateEventDefinitionSuccessAction => ({
  type: UPDATE_EVENT_DEFINITION_SUCCESS_ACTION,
  definition,
});

export const getEventLogEntries = (after?: string): FetchEventLogEntriesAction => ({
  type: FETCH_EVENT_LOG_ENTRIES_ACTION,
  after,
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
    details: value.payload,
  })),
  after,
  next,
});
