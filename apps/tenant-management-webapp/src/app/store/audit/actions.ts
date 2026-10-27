import type { AuditCatalog, AuditEventCriteria, AuditEventRecord, AuditRetention } from './models';

export const FETCH_AUDIT_CONFIGURATION_ACTION = 'audit/FETCH_AUDIT_CONFIGURATION_ACTION';
export const FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION = 'audit/FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION';
export const FETCH_AUDIT_EVENTS_ACTION = 'audit/FETCH_AUDIT_EVENTS_ACTION';
export const FETCH_AUDIT_EVENTS_SUCCESS_ACTION = 'audit/FETCH_AUDIT_EVENTS_SUCCESS_ACTION';
export const FETCH_AUDIT_EVENTS_FAILED_ACTION = 'audit/FETCH_AUDIT_EVENTS_FAILED_ACTION';
export const CLEAR_AUDIT_EVENTS_ACTION = 'audit/CLEAR_AUDIT_EVENTS_ACTION';
export const EXPORT_AUDIT_EVENTS_ACTION = 'audit/EXPORT_AUDIT_EVENTS_ACTION';
export const EXPORT_AUDIT_EVENTS_DONE_ACTION = 'audit/EXPORT_AUDIT_EVENTS_DONE_ACTION';

export interface ExportAuditEventsAction {
  type: typeof EXPORT_AUDIT_EVENTS_ACTION;
  criteria: AuditEventCriteria;
  includePersonalInfo: boolean;
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

export type AuditActionTypes =
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
): FetchAuditConfigurationSuccessAction => ({
  type: FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION,
  catalogs,
  retention,
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

export const clearAuditEvents = (): ClearAuditEventsAction => ({
  type: CLEAR_AUDIT_EVENTS_ACTION,
});

export const exportAuditEvents = (criteria: AuditEventCriteria, includePersonalInfo = false): ExportAuditEventsAction => ({
  type: EXPORT_AUDIT_EVENTS_ACTION,
  criteria,
  includePersonalInfo,
});

export const exportAuditEventsDone = (): ExportAuditEventsDoneAction => ({
  type: EXPORT_AUDIT_EVENTS_DONE_ACTION,
});
