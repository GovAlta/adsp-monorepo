import axios from 'axios';
import { store } from '../../../state/store';
import { getAccessToken } from '../../../state/user.slice';

const AUDIT_SERVICE_URN = 'urn:ads:platform:audit-service:v1';
const CONFIGURATION_SERVICE_URN = 'urn:ads:platform:configuration-service:v2';

// Adding an action needs audit-admin on the audit service and a Configuration service write.
const AUDIT_ADMIN_ROLE = 'urn:ads:platform:audit-service:audit-admin';
const CONFIGURATION_ADMIN_ROLE = 'urn:ads:platform:configuration-service:configuration-admin';

export const missingCatalogRoles = (roles: string[] = store.getState().user.user?.roles ?? []) => [
  ...(roles.includes(AUDIT_ADMIN_ROLE) ? [] : ['audit-admin']),
  ...(roles.includes(CONFIGURATION_ADMIN_ROLE) ? [] : ['configuration-admin']),
];

export const canWriteCatalog = (roles?: string[]) => missingCatalogRoles(roles).length === 0;

export type EventStatus = 'success' | 'failure' | 'blocked' | 'error';

export interface AuditEventInput {
  eventId: string;
  occurredAt: string;
  action: string;
  actionVersion?: number;
  status: EventStatus;
  actor: { id: string; type: 'user' | 'service' | 'system'; name?: string; email?: string; roles?: string[] };
  resource?: { type: string; id: string; name?: string };
  scopeIds?: string[];
  correlationId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  changeSet?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
}

export interface StoredAuditEvent extends AuditEventInput {
  id: string;
  namespace: string;
  writtenBy: string;
  receivedAt: string;
  category: string;
  severity: string;
  retentionClass: string;
  retentionUntil: string;
}

export interface EventQuery {
  top?: number;
  after?: string;
  actor?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  scope?: string;
  status?: EventStatus;
  category?: string;
  severity?: string;
  correlationId?: string;
  sessionId?: string;
  occurredFrom?: string;
  occurredTo?: string;
}

export interface EventPage {
  results: StoredAuditEvent[];
  page: { after?: string; size: number; next?: string };
}

export interface ActionDefinition {
  name: string;
  [key: string]: unknown;
}

export interface WriteResult {
  accepted: number;
  duplicates: number;
  rejected: { index: number; eventId?: string; code: string; reason: string }[];
}

export interface FailedEvent {
  id: string;
  [key: string]: unknown;
}

// The Directory entries are loaded into the store when the sandbox starts.
function getServiceUrl(urn: string): string {
  const url = store.getState().config.directory[urn];
  if (!url) {
    throw new Error(`${urn} is not registered in the Directory.`);
  }
  return url.replace(/\/$/, '');
}

const getBaseUrl = async () => getServiceUrl(AUDIT_SERVICE_URN);

async function request<T>(
  method: 'get' | 'post',
  path: string,
  options: { params?: unknown; data?: unknown; responseType?: 'blob' } = {},
) {
  const [url, token] = await Promise.all([getBaseUrl(), getAccessToken()]);
  const { data } = await axios.request<T>({
    method,
    url: `${url}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    ...options,
  });
  return data;
}

// Namespace the sandbox writes under; it must match the client's service name.
export const SAMPLE_NAMESPACE = 'sandbox-app';

// The action catalog the audit service validates written events against.
export const SAMPLE_CATALOG = {
  kind: 'actionCatalog',
  application: SAMPLE_NAMESPACE,
  actions: {
    'sample-action': {
      version: 1,
      category: 'runtime',
      severity: 'info',
      retentionClass: 'standard',
      description: 'Sample action written from the sandbox app',
      resourceType: 'sample-resource',
    },
  },
};

export const CATALOG_NOT_REGISTERED =
  'The sandbox action catalog is not registered yet, and registering it requires the configuration-admin role. Ask a user with that role to open this page once.';

// Registers the sample's action catalog as audit-service configuration (actions-<namespace>) when it is missing.
// Returns true if the catalog was created. Creating it requires the configuration-admin role.
export async function ensureActionCatalog(): Promise<boolean> {
  try {
    await getActions(SAMPLE_NAMESPACE);
    return false;
  } catch (err) {
    if (!axios.isAxiosError(err) || err.response?.status !== 404) {
      throw err;
    }
  }

  if (missingCatalogRoles().includes('configuration-admin')) {
    throw new Error(CATALOG_NOT_REGISTERED);
  }
  await patchCatalog({ operation: 'REPLACE', configuration: SAMPLE_CATALOG });
  return true;
}

export interface NewAction {
  version: number;
  category: string;
  severity: string;
  retentionClass: string;
  description?: string;
  resourceType?: string;
  captureChangeSet?: boolean;
  forwardToSiem?: boolean;
}

// Adds one action to the sample namespace's catalog. The audit service rejects names that already exist in the
// namespace or in a Core namespace (409). Requires audit-admin and the configuration-admin role.
export const addAction = (name: string, action: NewAction) =>
  request<unknown>('post', `/${encodeURIComponent(SAMPLE_NAMESPACE)}/actions`, { data: { name, ...action } });

async function patchCatalog(body: unknown) {
  const configurationUrl = getServiceUrl(CONFIGURATION_SERVICE_URN);
  const token = await getAccessToken();
  await axios.request({
    method: 'patch',
    url: `${configurationUrl}/configuration/audit-service/actions-${SAMPLE_NAMESPACE}`,
    headers: { Authorization: `Bearer ${token}` },
    data: body,
  });
}

const eventsPath = (namespace?: string) => (namespace ? `/${encodeURIComponent(namespace)}/events` : '/events');

// Requires audit-reader.
export const getActions = (namespace: string) =>
  request<ActionDefinition[]>('get', `/${encodeURIComponent(namespace)}/actions`);
// Every catalog visible to the tenant, including Core's. Requires audit-reader.
export const getCatalogs = () =>
  request<{ application: string; core: boolean; actions: ActionDefinition[] }[]>('get', '/actions');
// Distinct namespaces that have events for the tenant, whether or not their catalog is visible.
export const getNamespaces = async () => (await request<{ results: string[] }>('get', '/namespaces')).results;
export const getEvents = (query: EventQuery, namespace?: string) =>
  request<EventPage>('get', eventsPath(namespace), { params: query });
// The service streams every matching event as CSV; actor name and email are redacted unless the caller is audit-admin.
export const exportEvents = (query: EventQuery, namespace?: string) =>
  request<Blob>('get', `${eventsPath(namespace)}/export`, {
    params: { ...query, top: undefined, after: undefined },
    responseType: 'blob',
  });
export const getEvent = (namespace: string, id: string) =>
  request<StoredAuditEvent>('get', `${eventsPath(namespace)}/${encodeURIComponent(id)}`);

// Requires audit-writer.
export const writeEvents = (namespace: string, events: AuditEventInput[]) =>
  request<WriteResult>('post', eventsPath(namespace), { data: { events } });

// Require audit-admin.
export const getFailedEvents = (params: { top?: number; after?: string } = {}) =>
  request<{ results: FailedEvent[]; page: { next?: string } }>('get', '/failed-events', { params });
export const replayFailedEvent = (id: string) =>
  request<unknown>('post', `/failed-events/${encodeURIComponent(id)}/replay`);
