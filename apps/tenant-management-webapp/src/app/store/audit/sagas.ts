import { SagaIterator } from '@redux-saga/core';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import { RootState } from '..';
import { ErrorNotification, SuccessNotification } from '../notifications/actions';
import { UpdateIndicator } from '../session/actions';
import { getAccessToken } from '../tenant/sagas';
import {
  EXPORT_AUDIT_EVENTS_ACTION,
  ExportAuditEventsAction,
  FETCH_AUDIT_CONFIGURATION_ACTION,
  FETCH_AUDIT_EVENTS_ACTION,
  FetchAuditEventsAction,
  exportAuditEventsDone,
  fetchAuditConfigurationSuccess,
  fetchAuditEventsFailed,
  fetchAuditEventsSuccess,
} from './actions';
import { downloadFile } from './export';
import {
  AUDIT_DEFAULT_PAGE_SIZE,
  AUDIT_NAMESPACE,
  AUDIT_SERVICE_CATALOG,
  AuditAction,
  AuditCatalog,
  AuditEventCriteria,
  AuditRetention,
  RetentionClasses,
} from './models';

const ACTIONS_PREFIX = 'actions-';
const RETENTION_PREFIX = 'retention-';

interface ConfigurationResult {
  name: string;
  latest?: { configuration?: Record<string, unknown> };
}

function toCatalog(application: string, configuration: Record<string, unknown>, isCore: boolean): AuditCatalog {
  const actions = (configuration.actions || {}) as Record<string, Omit<AuditAction, 'name'>>;
  return {
    application,
    isCore,
    actions: Object.entries(actions)
      .map(([name, action]) => ({ ...action, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function mapAuditConfiguration(
  results: ConfigurationResult[],
  coreCatalog?: Record<string, unknown>,
): { catalogs: AuditCatalog[]; retention: AuditRetention } {
  const catalogs: AuditCatalog[] = [];
  const retention: AuditRetention = { tenant: {}, applications: {} };

  for (const { name, latest } of results) {
    const configuration = latest?.configuration;
    if (!configuration) {
      continue;
    }
    if (name.startsWith(ACTIONS_PREFIX)) {
      catalogs.push(toCatalog(name.substring(ACTIONS_PREFIX.length), configuration, false));
    } else if (name === 'retention') {
      retention.tenant = (configuration.classes || {}) as RetentionClasses;
    } else if (name.startsWith(RETENTION_PREFIX)) {
      retention.applications[name.substring(RETENTION_PREFIX.length)] = (configuration.classes ||
        {}) as RetentionClasses;
    }
  }

  if (coreCatalog && !catalogs.some((c) => c.application === 'audit-service')) {
    catalogs.push(toCatalog('audit-service', coreCatalog, true));
  }

  catalogs.sort((a, b) => a.application.localeCompare(b.application));
  return { catalogs, retention };
}

function eventsUrl(auditBaseUrl: string, criteria: AuditEventCriteria, top: number, after?: string): string {
  const { namespace, ...filters } = criteria;
  const params = new URLSearchParams({ top: String(top) });
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
  if (after) {
    params.set('after', after);
  }
  const path = namespace ? `/${encodeURIComponent(namespace)}/events` : '/events';
  return `${auditBaseUrl}/audit/v1${path}?${params.toString()}`;
}

function exportUrl(auditBaseUrl: string, criteria: AuditEventCriteria): string {
  const { namespace, ...filters } = criteria;
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
  const path = namespace ? `/${encodeURIComponent(namespace)}/events/export` : '/events/export';
  return `${auditBaseUrl}/audit/v1${path}?${params.toString()}`;
}

async function fetchAll(baseUrl: string, headers: Record<string, string>): Promise<ConfigurationResult[]> {
  const results: ConfigurationResult[] = [];
  const url = `${baseUrl}?top=50`;
  let next: string | undefined;
  do {
    const { data } = await axios.get(next ? `${url}&after=${next}` : url, { headers });
    results.push(...data.results);
    next = data.page?.next;
  } while (next);
  return results;
}

export function* fetchAuditConfiguration(): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Loading...' }));

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl,
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = `${configBaseUrl}/configuration/v2/configuration/${AUDIT_NAMESPACE}`;
      const results: ConfigurationResult[] = yield call(fetchAll, baseUrl, headers);

      // The audit service's own catalog is a core document, so it is not part of the tenant listing.
      let coreCatalog: Record<string, unknown> | undefined;
      try {
        const { data } = yield call(axios.get, `${baseUrl}/${AUDIT_SERVICE_CATALOG}?core`, { headers });
        coreCatalog = data?.latest?.configuration;
      } catch {
        coreCatalog = undefined;
      }

      // Namespaces that have events, including those whose catalog is not readable by the tenant.
      let namespaces: string[] = [];
      const auditBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.auditServiceApiUrl);
      if (auditBaseUrl) {
        try {
          const { data } = yield call(axios.get, `${auditBaseUrl}/audit/v1/namespaces`, { headers });
          namespaces = data?.results || [];
        } catch {
          namespaces = [];
        }
      }

      const { catalogs, retention } = mapAuditConfiguration(results, coreCatalog);
      yield put(fetchAuditConfigurationSuccess(catalogs, retention, namespaces));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
  yield put(UpdateIndicator({ show: false }));
}

export function* fetchAuditEvents(action: FetchAuditEventsAction): SagaIterator {
  const auditBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.auditServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (!auditBaseUrl || !token) {
    if (!auditBaseUrl) {
      yield put(ErrorNotification({ message: 'Audit service is not registered in the platform directory.' }));
    }
    yield put(fetchAuditEventsFailed());
    return;
  }

  try {
    const { data } = yield call(axios.get, eventsUrl(auditBaseUrl, action.criteria, action.top ?? AUDIT_DEFAULT_PAGE_SIZE, action.after), {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Pages replace each other rather than accumulate.
    yield put(fetchAuditEventsSuccess(data.results, data.page?.next, false));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
    yield put(fetchAuditEventsFailed());
  }
}

// Error bodies arrive as Blobs when responseType is 'blob'; unwrap them so the notification shows the server message.
async function readBlobError(err: unknown): Promise<unknown> {
  const response = (err as { response?: { data?: unknown; status?: number } })?.response;
  if (response?.data instanceof Blob) {
    const text = await response.data.text();
    let message = text;
    try {
      const body = JSON.parse(text);
      message = body?.errorMessage || body?.message || text;
    } catch {
      // Not JSON; use the raw text.
    }
    return new Error(`${response.status ?? ''} ${message}`.trim());
  }
  return err;
}

export function* exportAuditEvents(action: ExportAuditEventsAction): SagaIterator {
  const auditBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.auditServiceApiUrl);
  const token: string = yield call(getAccessToken);

  try {
    if (!auditBaseUrl || !token) {
      throw new Error('Audit service is not registered in the platform directory.');
    }

    const headers = { Authorization: `Bearer ${token}` };
    // The server builds the CSV, streams every matching event and redacts actor details unless the caller is audit-admin.
    const { data } = yield call(axios.get, exportUrl(auditBaseUrl, action.criteria), {
      headers,
      responseType: 'blob',
    });
    yield call(downloadFile, `audit-events-${new Date().toISOString().slice(0, 10)}.csv`, data, 'text/csv');
    yield put(SuccessNotification({ message: 'Exported the matching audit events.' }));
  } catch (err) {
    const error: unknown = yield call(readBlobError, err);
    yield put(ErrorNotification({ error }));
  }
  yield put(exportAuditEventsDone());
}

export function* watchAuditSagas(): Generator {
  yield takeLatest(EXPORT_AUDIT_EVENTS_ACTION, exportAuditEvents);
  yield takeLatest(FETCH_AUDIT_CONFIGURATION_ACTION, fetchAuditConfiguration);
  yield takeLatest(FETCH_AUDIT_EVENTS_ACTION, fetchAuditEvents);
}
