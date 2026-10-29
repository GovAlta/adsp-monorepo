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
import { downloadFile, eventsToCsv } from './export';
import {
  AUDIT_DEFAULT_PAGE_SIZE,
  AUDIT_EXPORT_LIMIT,
  AUDIT_EXPORT_PAGE_SIZE,
  AuditAction,
  AuditCatalog,
  AuditEventCriteria,
  AuditEventRecord,
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

export function* fetchAuditConfiguration(): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Loading...' }));

  const auditBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.auditServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (auditBaseUrl && token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // The audit service resolves catalogs and retention (active revision, Core merged) as it applies them.
      const [catalogResponse, retentionResponse]: { data: unknown }[] = yield all([
        call(axios.get, `${auditBaseUrl}/audit/v1/actions`, { headers }),
        call(axios.get, `${auditBaseUrl}/audit/v1/retention`, { headers }),
      ]);
      yield put(
        fetchAuditConfigurationSuccess(
          toCatalogs(catalogResponse.data as CatalogListing[]),
          retentionResponse.data as AuditRetention,
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

export function* exportAuditEvents(action: ExportAuditEventsAction): SagaIterator {
  const auditBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.auditServiceApiUrl);
  const token: string = yield call(getAccessToken);

  try {
    if (!auditBaseUrl || !token) {
      throw new Error('Audit service is not registered in the platform directory.');
    }

    const headers = { Authorization: `Bearer ${token}` };
    const events: AuditEventRecord[] = [];
    let after: string | undefined;
    do {
      const { data } = yield call(axios.get, eventsUrl(auditBaseUrl, action.criteria, AUDIT_EXPORT_PAGE_SIZE, after), {
        headers,
      });
      events.push(...data.results);
      after = data.page?.next;
    } while (after && events.length < AUDIT_EXPORT_LIMIT);

    const exported = events.slice(0, AUDIT_EXPORT_LIMIT);
    yield call(
      downloadFile,
      `audit-events-${new Date().toISOString().slice(0, 10)}.csv`,
      eventsToCsv(exported, action.includePersonalInfo),
      'text/csv',
    );
    const truncated = !!after || events.length > AUDIT_EXPORT_LIMIT;
    yield put(
      SuccessNotification({
        message: truncated
          ? `Exported the newest ${exported.length} events. Narrow the filters to export older events.`
          : `Exported ${exported.length} events.`,
      }),
    );
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
  yield put(exportAuditEventsDone());
}

export function* watchAuditSagas(): Generator {
  yield takeLatest(EXPORT_AUDIT_EVENTS_ACTION, exportAuditEvents);
  yield takeLatest(FETCH_AUDIT_CONFIGURATION_ACTION, fetchAuditConfiguration);
  yield takeLatest(FETCH_AUDIT_EVENTS_ACTION, fetchAuditEvents);
}
