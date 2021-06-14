import { EventLogEntry } from './models';

export const FETCH_EVENT_LOG_ENTRIES_ACTION = 'eventLog/FETCH_EVENT_LOG_ENTRIES_ACTION';
export const FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION = 'eventLog/FETCH_EVENT_LOG_ENTRIES_SUCCESS_ACTION';

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

export type EventLogActionTypes = FetchEventLogEntriesAction | FetchEventLogEntriesSuccessAction;

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
