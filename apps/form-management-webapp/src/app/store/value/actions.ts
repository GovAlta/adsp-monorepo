import type { ValueDefinition, ValueLogEntry, ValueMetrics, ValueSearchCriteria } from './models';

export const FETCH_VALUE_DEFINITIONS_ACTION = 'value/FETCH_VALUE_DEFINITIONS_ACTION';
export const FETCH_VALUE_DEFINITIONS_SUCCESS_ACTION = 'value/FETCH_VALUE_DEFINITIONS_SUCCESS_ACTION';
export const DELETE_VALUE_DEFINITION_ACTION = 'value/DELETE_VALUE_DEFINITION_ACTION';
export const DELETE_VALUE_DEFINITION_SUCCESS_ACTION = 'value/DELETE_VALUE_DEFINITION_SUCCESS_ACTION';

export const UPDATE_VALUE_DEFINITION_ACTION = 'value/UPDATE_VALUE_DEFINITION_ACTION';
export const UPDATE_VALUE_DEFINITION_SUCCESS_ACTION = 'value/UPDATE_VALUE_DEFINITION_SUCCESS_ACTION';

export const FETCH_VALUE_LOG_ENTRIES_ACTION = 'valueLog/FETCH_VALUE_LOG_ENTRIES_ACTION';
export const FETCH_VALUE_LOG_ENTRIES_SUCCESS_ACTION = 'valueLog/FETCH_VALUE_LOG_ENTRIES_SUCCESS_ACTION';

export const CLEAR_VALUE_LOG_ENTRIES_SUCCESS_ACTION = 'valueLog/CLEAR_VALUE_LOG_ENTRIES_SUCCESS_ACTION';

export const FETCH_VALUE_METRICS_ACTION = 'value/FETCH_VALUE_METRICS_ACTION';
export const FETCH_VALUE_METRICS_SUCCESS_ACTION = 'value/FETCH_VALUE_METRICS_SUCCESS_ACTION';

export interface FetchValueDefinitionsAction {
  type: typeof FETCH_VALUE_DEFINITIONS_ACTION;
}

export interface FetchValueDefinitionsSuccessAction {
  type: typeof FETCH_VALUE_DEFINITIONS_SUCCESS_ACTION;
  results: ValueDefinition[];
}

export interface DeleteValueDefinitionAction {
  type: typeof DELETE_VALUE_DEFINITION_ACTION;
  definition: ValueDefinition;
}

export interface DeleteValueDefinitionSuccessAction {
  type: typeof DELETE_VALUE_DEFINITION_SUCCESS_ACTION;
  definition: ValueDefinition;
}

export interface UpdateValueDefinitionAction {
  type: typeof UPDATE_VALUE_DEFINITION_ACTION;
  definition: ValueDefinition;
}

export interface UpdateValueDefinitionSuccessAction {
  type: typeof UPDATE_VALUE_DEFINITION_SUCCESS_ACTION;
  definition: ValueDefinition;
}

export interface FetchValueLogEntriesAction {
  type: typeof FETCH_VALUE_LOG_ENTRIES_ACTION;
  after: string;
  searchCriteria: ValueSearchCriteria;
}

export interface FetchValueLogEntriesSuccessAction {
  type: typeof FETCH_VALUE_LOG_ENTRIES_SUCCESS_ACTION;
  entries: ValueLogEntry[];
  after: string;
  next: string;
}

export interface ClearValueLogEntriesSuccessAction {
  type: typeof CLEAR_VALUE_LOG_ENTRIES_SUCCESS_ACTION;
}

export interface FetchValueMetricsAction {
  type: typeof FETCH_VALUE_METRICS_ACTION;
}

export interface FetchValueMetricsSuccessAction {
  type: typeof FETCH_VALUE_METRICS_SUCCESS_ACTION;
  metrics: ValueMetrics;
}

export type ValueActionTypes =
  | FetchValueDefinitionsAction
  | FetchValueDefinitionsSuccessAction
  | DeleteValueDefinitionAction
  | DeleteValueDefinitionSuccessAction
  | UpdateValueDefinitionAction
  | UpdateValueDefinitionSuccessAction
  | FetchValueLogEntriesAction
  | FetchValueLogEntriesSuccessAction
  | ClearValueLogEntriesSuccessAction
  | FetchValueMetricsAction
  | FetchValueMetricsSuccessAction;

export const getValueDefinitions = (): FetchValueDefinitionsAction => ({
  type: FETCH_VALUE_DEFINITIONS_ACTION,
});

export const getValueDefinitionsSuccess = (results: ValueDefinition[]): FetchValueDefinitionsSuccessAction => ({
  type: FETCH_VALUE_DEFINITIONS_SUCCESS_ACTION,
  results,
});

export const deleteValueDefinition = (definition: ValueDefinition): DeleteValueDefinitionAction => ({
  type: DELETE_VALUE_DEFINITION_ACTION,
  definition,
});

export const deleteValueDefinitionSuccess = (definition: ValueDefinition): DeleteValueDefinitionSuccessAction => ({
  type: DELETE_VALUE_DEFINITION_SUCCESS_ACTION,
  definition,
});

export const updateValueDefinition = (definition: ValueDefinition): UpdateValueDefinitionAction => ({
  type: UPDATE_VALUE_DEFINITION_ACTION,
  definition,
});

export const updateValueDefinitionSuccess = (definition: ValueDefinition): UpdateValueDefinitionSuccessAction => ({
  type: UPDATE_VALUE_DEFINITION_SUCCESS_ACTION,
  definition,
});

export const getValueLogEntries = (
  after?: string,
  searchCriteria?: ValueSearchCriteria
): FetchValueLogEntriesAction => ({
  type: FETCH_VALUE_LOG_ENTRIES_ACTION,
  after,
  searchCriteria,
});

export const getValueLogEntriesSucceeded = (
  results: {
    context: Record<string, string>;
    timestamp: string;
    correlationId: string;
    value: { payload: Record<string, unknown> };
  }[],
  after: string,
  next: string
): FetchValueLogEntriesSuccessAction => ({
  type: FETCH_VALUE_LOG_ENTRIES_SUCCESS_ACTION,
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

export const clearValueLogEntries = (): ClearValueLogEntriesSuccessAction => ({
  type: CLEAR_VALUE_LOG_ENTRIES_SUCCESS_ACTION,
});

export const fetchValueMetrics = (): FetchValueMetricsAction => ({
  type: FETCH_VALUE_METRICS_ACTION,
});

export const fetchValueMetricsSucceeded = (metrics: ValueMetrics): FetchValueMetricsSuccessAction => ({
  type: FETCH_VALUE_METRICS_SUCCESS_ACTION,
  metrics,
});
