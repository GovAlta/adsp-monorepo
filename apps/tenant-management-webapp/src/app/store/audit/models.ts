export const AUDIT_PAGE_SIZES = [10, 30, 50, 100];
export const AUDIT_DEFAULT_PAGE_SIZE = 30;

export const DEFAULT_RETENTION_DAYS: Record<string, number> = {
  standard: 90,
  security: 365,
  compliance: 365,
};

export interface AuditAction {
  name: string;
  version?: string;
  description?: string;
  category?: string;
  severity?: string;
  retentionClass?: string;
  resourceType?: string;
  captureChangeSet?: boolean;
  forwardToSiem?: boolean;
  metadataSchema?: Record<string, unknown>;
}

export interface AuditCatalog {
  application: string;
  isCore: boolean;
  actions: AuditAction[];
}

export type RetentionClasses = Record<string, { days: number }>;

export interface AuditRetention {
  tenant: RetentionClasses;
  applications: Record<string, RetentionClasses>;
}

export interface AuditEventRecord {
  id: string;
  namespace: string;
  occurredAt: string;
  action: string;
  category: string;
  status: string;
  severity?: string;
  actor: { id?: string; type?: string; name?: string; email?: string; roles?: string[] };
  resource?: { type: string; id?: string; name?: string };
  correlationId?: string;
  sessionId?: string;
  scopeIds?: string[];
  changeSet?: { before?: unknown; after?: unknown };
  metadata?: Record<string, unknown>;
  retentionClass?: string;
  retentionUntil?: string;
}

export interface AuditEventCriteria {
  namespace?: string;
  action?: string;
  actor?: string;
  resourceType?: string;
  resourceId?: string;
  scope?: string;
  category?: string;
  status?: string;
  severity?: string;
  correlationId?: string;
  sessionId?: string;
  occurredFrom?: string;
  occurredTo?: string;
}

export interface AuditEventsState {
  results: AuditEventRecord[];
  next?: string;
  loading: boolean;
}

export interface AuditQueryState {
  criteria: AuditEventCriteria;
  applied: AuditEventCriteria;
  searched: boolean;
  pageSize: number;
  page: number;
  // The API pages by cursor, so the cursor that opens each page is remembered to allow going back.
  cursors: (string | undefined)[];
}

export interface AuditSelectedEventState {
  event?: AuditEventRecord;
  loading: boolean;
  notFound: boolean;
}

export interface AuditState {
  catalogs: AuditCatalog[];
  retention: AuditRetention;
  namespaces: string[];
  loaded: boolean;
  exporting: boolean;
  events: AuditEventsState;
  query: AuditQueryState;
  selected: AuditSelectedEventState;
}

export const defaultAuditQuery: AuditQueryState = {
  criteria: {},
  applied: {},
  searched: false,
  pageSize: AUDIT_DEFAULT_PAGE_SIZE,
  page: 0,
  cursors: [undefined],
};

export const defaultAuditState: AuditState = {
  catalogs: [],
  retention: { tenant: {}, applications: {} },
  namespaces: [],
  loaded: false,
  exporting: false,
  events: { results: [], loading: false },
  query: defaultAuditQuery,
  selected: { loading: false, notFound: false },
};
