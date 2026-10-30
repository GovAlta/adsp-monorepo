import { SagaIterator } from '@redux-saga/core';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';
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
  AuditAction,
  AuditCatalog,
  AuditEventCriteria,
  AuditRetention,
} from './models';

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

// Older audit services have no namespaces endpoint; fall back to the catalog namespaces.
function* listNamespaces(auditBaseUrl: string, headers: Record<string, string>): SagaIterator {
  try {
    return yield call(axios.get, `${auditBaseUrl}/audit/v1/namespaces`, { headers });
  } catch {
    return { data: { results: [] } };
  }
}

export function* fetchAuditConfiguration(): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Loading...' }));

  const auditBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.auditServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (auditBaseUrl && token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // The audit service resolves catalogs and retention (active revision, Core merged) as it applies them.
      // Namespaces that have events include those whose catalog is not readable by the tenant.
      const [catalogResponse, retentionResponse, namespacesResponse]: { data: unknown }[] = yield all([
        call(axios.get, `${auditBaseUrl}/audit/v1/actions`, { headers }),
        call(axios.get, `${auditBaseUrl}/audit/v1/retention`, { headers }),
        call(listNamespaces, auditBaseUrl, headers),
      ]);
      yield put(
        fetchAuditConfigurationSuccess(
          toCatalogs(catalogResponse.data as CatalogListing[]),
          retentionResponse.data as AuditRetention,
          (namespacesResponse.data as { results?: string[] })?.results || [],
        ),
      );

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
