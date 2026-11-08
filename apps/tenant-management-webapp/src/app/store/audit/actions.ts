import type { AuditCatalog, AuditEventCriteria, AuditEventRecord, AuditQueryState, AuditRetention } from './models';

export const FETCH_AUDIT_CONFIGURATION_ACTION = 'audit/FETCH_AUDIT_CONFIGURATION_ACTION';
export const FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION = 'audit/FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION';
export const FETCH_AUDIT_EVENTS_ACTION = 'audit/FETCH_AUDIT_EVENTS_ACTION';
export const FETCH_AUDIT_EVENTS_SUCCESS_ACTION = 'audit/FETCH_AUDIT_EVENTS_SUCCESS_ACTION';
export const FETCH_AUDIT_EVENTS_FAILED_ACTION = 'audit/FETCH_AUDIT_EVENTS_FAILED_ACTION';
export const CLEAR_AUDIT_EVENTS_ACTION = 'audit/CLEAR_AUDIT_EVENTS_ACTION';
export const SET_AUDIT_QUERY_ACTION = 'audit/SET_AUDIT_QUERY_ACTION';
export const FETCH_AUDIT_EVENT_ACTION = 'audit/FETCH_AUDIT_EVENT_ACTION';
export const FETCH_AUDIT_EVENT_SUCCESS_ACTION = 'audit/FETCH_AUDIT_EVENT_SUCCESS_ACTION';
export const FETCH_AUDIT_EVENT_FAILED_ACTION = 'audit/FETCH_AUDIT_EVENT_FAILED_ACTION';
export const EXPORT_AUDIT_EVENTS_ACTION = 'audit/EXPORT_AUDIT_EVENTS_ACTION';
export const EXPORT_AUDIT_EVENTS_DONE_ACTION = 'audit/EXPORT_AUDIT_EVENTS_DONE_ACTION';

export interface ExportAuditEventsAction {
  type: typeof EXPORT_AUDIT_EVENTS_ACTION;
  criteria: AuditEventCriteria;
}

export interface ExportAuditEventsDoneAction {
  type: typeof EXPORT_AUDIT_EVENTS_DONE_ACTION;
}

export interface FetchAuditConfigurationAction {
  type: typeof FETCH_AUDIT_CONFIGURATION_ACTION;
}

export interface FetchAuditConfigurationSuccessAction {
  type: typeof FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION;
  catalogs: AuditCatalog[];
  retention: AuditRetention;
  namespaces: string[];
}

export interface FetchAuditEventsAction {
  type: typeof FETCH_AUDIT_EVENTS_ACTION;
  criteria: AuditEventCriteria;
  after?: string;
  top?: number;
}

export interface FetchAuditEventsSuccessAction {
  type: typeof FETCH_AUDIT_EVENTS_SUCCESS_ACTION;
  results: AuditEventRecord[];
  next?: string;
  append: boolean;
}

export interface FetchAuditEventsFailedAction {
  type: typeof FETCH_AUDIT_EVENTS_FAILED_ACTION;
}

export interface ClearAuditEventsAction {
  type: typeof CLEAR_AUDIT_EVENTS_ACTION;
}

export interface SetAuditQueryAction {
  type: typeof SET_AUDIT_QUERY_ACTION;
  query: Partial<AuditQueryState>;
}

export interface FetchAuditEventAction {
  type: typeof FETCH_AUDIT_EVENT_ACTION;
  namespace: string;
  id: string;
}

export interface FetchAuditEventSuccessAction {
  type: typeof FETCH_AUDIT_EVENT_SUCCESS_ACTION;
  event: AuditEventRecord;
}

export interface FetchAuditEventFailedAction {
  type: typeof FETCH_AUDIT_EVENT_FAILED_ACTION;
  notFound: boolean;
}

export type AuditActionTypes =
  | SetAuditQueryAction
  | FetchAuditEventAction
  | FetchAuditEventSuccessAction
  | FetchAuditEventFailedAction
  | FetchAuditConfigurationAction
  | FetchAuditConfigurationSuccessAction
  | FetchAuditEventsAction
  | FetchAuditEventsSuccessAction
  | FetchAuditEventsFailedAction
  | ClearAuditEventsAction
  | ExportAuditEventsAction
  | ExportAuditEventsDoneAction;

export const fetchAuditConfiguration = (): FetchAuditConfigurationAction => ({
  type: FETCH_AUDIT_CONFIGURATION_ACTION,
});

export const fetchAuditConfigurationSuccess = (
  catalogs: AuditCatalog[],
  retention: AuditRetention,
  namespaces: string[] = [],
): FetchAuditConfigurationSuccessAction => ({
  type: FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION,
  catalogs,
  retention,
  namespaces,
});

export const fetchAuditEvents = (criteria: AuditEventCriteria, after?: string, top?: number): FetchAuditEventsAction => ({
  type: FETCH_AUDIT_EVENTS_ACTION,
  criteria,
  after,
  top,
});

export const fetchAuditEventsSuccess = (
  results: AuditEventRecord[],
  next: string | undefined,
  append: boolean,
): FetchAuditEventsSuccessAction => ({
  type: FETCH_AUDIT_EVENTS_SUCCESS_ACTION,
  results,
  next,
  append,
});

export const fetchAuditEventsFailed = (): FetchAuditEventsFailedAction => ({
  type: FETCH_AUDIT_EVENTS_FAILED_ACTION,
});

export const setAuditQuery = (query: Partial<AuditQueryState>): SetAuditQueryAction => ({
  type: SET_AUDIT_QUERY_ACTION,
  query,
});

export const fetchAuditEvent = (namespace: string, id: string): FetchAuditEventAction => ({
  type: FETCH_AUDIT_EVENT_ACTION,
  namespace,
  id,
});

export const fetchAuditEventSuccess = (event: AuditEventRecord): FetchAuditEventSuccessAction => ({
  type: FETCH_AUDIT_EVENT_SUCCESS_ACTION,
  event,
});

export const fetchAuditEventFailed = (notFound = false): FetchAuditEventFailedAction => ({
  type: FETCH_AUDIT_EVENT_FAILED_ACTION,
  notFound,
});

export const clearAuditEvents = (): ClearAuditEventsAction => ({
  type: CLEAR_AUDIT_EVENTS_ACTION,
});

export const exportAuditEvents = (criteria: AuditEventCriteria): ExportAuditEventsAction => ({
  type: EXPORT_AUDIT_EVENTS_ACTION,
  criteria,
});

export const exportAuditEventsDone = (): ExportAuditEventsDoneAction => ({
  type: EXPORT_AUDIT_EVENTS_DONE_ACTION,
});
