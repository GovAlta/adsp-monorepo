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
  AuditAction,
  AuditCatalog,
  AuditEventCriteria,
  AuditRetention,
  RetentionClasses,
} from './models';

const RETENTION_PREFIX = 'retention-';

interface ConfigurationResult {
  name: string;
  latest?: { configuration?: Record<string, unknown> };
}

interface CatalogListing {
  application: string;
  core: boolean;
  actions: AuditAction[];
}

export function toCatalogs(listings: CatalogListing[]): AuditCatalog[] {
  return (listings || [])
    .map(({ application, core, actions }) => ({
      application,
      isCore: !!core,
      actions: [...(actions || [])].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.application.localeCompare(b.application));
}

export function mapAuditConfiguration(results: ConfigurationResult[]): { retention: AuditRetention } {
  const retention: AuditRetention = { tenant: {}, applications: {} };

  for (const { name, latest } of results) {
    const configuration = latest?.configuration;
    if (!configuration) {
      continue;
    }
    if (name === 'retention') {
      retention.tenant = (configuration.classes || {}) as RetentionClasses;
    } else if (name.startsWith(RETENTION_PREFIX)) {
      retention.applications[name.substring(RETENTION_PREFIX.length)] = (configuration.classes ||
        {}) as RetentionClasses;
    }
  }

  return { retention };
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
  const auditBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.auditServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = `${configBaseUrl}/configuration/v2/configuration/${AUDIT_NAMESPACE}`;
      const results: ConfigurationResult[] = yield call(fetchAll, baseUrl, headers);

      // Core catalogs are not part of the tenant configuration listing, so the audit service resolves all of them.
      let catalogs: AuditCatalog[] = [];
      if (auditBaseUrl) {
        const { data } = yield call(axios.get, `${auditBaseUrl}/audit/v1/actions`, { headers });
        catalogs = toCatalogs(data);
      }

      // Namespaces that have events, including those whose catalog is not readable by the tenant.
      let namespaces: string[] = [];
      if (auditBaseUrl) {
        try {
          const { data } = yield call(axios.get, `${auditBaseUrl}/audit/v1/namespaces`, { headers });
          namespaces = data?.results || [];
        } catch {
          namespaces = [];
        }
      }

      const { retention } = mapAuditConfiguration(results);
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
    const { data } = yield call(
      axios.get,
      eventsUrl(auditBaseUrl, action.criteria, action.top ?? AUDIT_DEFAULT_PAGE_SIZE, action.after),
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
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
