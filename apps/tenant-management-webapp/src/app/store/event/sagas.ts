import axios from 'axios';
import { all, select, call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { RootState } from '..';
import {
  deleteEventDefinitionSuccess,
  DELETE_EVENT_DEFINITION_ACTION,
  FetchEventDefinitionsAction,
  FetchEventLogEntriesAction,
  FetchEventLogPageAction,
  fetchEventMetricsSucceeded,
  FETCH_EVENT_DEFINITIONS_ACTION,
  FETCH_EVENT_LOG_ENTRIES_ACTION,
  FETCH_EVENT_LOG_PAGE_ACTION,
  FETCH_EVENT_METRICS_ACTION,
  getEventDefinitionsSuccess,
  getEventLogEntriesSucceeded,
  getEventLogEntriesFailed,
  getEventLogPageSucceeded,
  UpdateEventDefinitionAction,
  updateEventDefinitionSuccess,
  UPDATE_EVENT_DEFINITION_ACTION,
} from './actions';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { getAccessToken } from '@store/tenant/sagas';
import { fetchServiceMetrics } from '@store/common';
import { EventDefinition, EventSearchCriteria, EVENT_LOG_PAGE_SIZE } from './models';

export function* fetchEventDefinitions(_action: FetchEventDefinitionsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    }),
  );

  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.eventServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { data: definitions } = yield call(axios.get, `${baseUrl}/event/v1/definitions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(getEventDefinitionsSuccess(definitions));
      yield put(
        UpdateIndicator({
          show: false,
        }),
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        }),
      );
    }
  }
}

export function* updateEventDefinition({ definition }: UpdateEventDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.eventServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const definitions: Record<string, EventDefinition> = yield select((state: RootState) => state.event.definitions);

  if (baseUrl && token) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const isExisting = !!definitions[`${definition.namespace}:${definition.name}`];
      const body = { description: definition.description, payloadSchema: definition.payloadSchema };

      const { data } = isExisting
        ? yield call(axios.patch, `${baseUrl}/event/v1/definitions/${definition.namespace}/${definition.name}`, body, {
            headers,
          })
        : yield call(
            axios.post,
            `${baseUrl}/event/v1/definitions`,
            { ...body, namespace: definition.namespace, name: definition.name },
            { headers },
          );

      yield put(updateEventDefinitionSuccess(data));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* deleteEventDefinition({ definition }: UpdateEventDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.eventServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      yield call(axios.delete, `${baseUrl}/event/v1/definitions/${definition.namespace}/${definition.name}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(deleteEventDefinitionSuccess(definition));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* fetchEventLogEntries(action: FetchEventLogEntriesAction): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);
  let eventUrl = `${baseUrl}/value/v1/event-service/values/event?top=${action.searchCriteria?.top || 10}&after=${
    action.after || ''
  }`;
  if (baseUrl && token) {
    if (action.searchCriteria) {
      let contextObj = {};
      if (action.searchCriteria.namespace) {
        contextObj['namespace'] = action.searchCriteria.namespace;
      }

      if (action.searchCriteria.name) {
        contextObj['name'] = action.searchCriteria.name;
      }

      if (action.searchCriteria?.context) {
        contextObj = { ...contextObj, ...action.searchCriteria?.context };
      }

      if (Object.entries(contextObj).length > 0) {
        eventUrl = `${eventUrl}&context=${JSON.stringify(contextObj)}`;
      }

      if (action.searchCriteria.timestampMax) {
        const maxDate = new Date(action.searchCriteria.timestampMax);
        eventUrl = `${eventUrl}&timestampMax=${maxDate.toISOString()}`;
      }
      if (action.searchCriteria.applications) {
        eventUrl = `${eventUrl}&value=${action.searchCriteria.applications}`;
      }
      if (action.searchCriteria.url) {
        eventUrl = `${eventUrl}&url=${action.searchCriteria.url}`;
      }
      if (action.searchCriteria.timestampMin) {
        const minDate = new Date(action.searchCriteria.timestampMin);
        eventUrl = `${eventUrl}&timestampMin=${minDate.toISOString()}`;
      }
      if (action.searchCriteria.correlationId) {
        eventUrl = `${eventUrl}&correlationId=${action.searchCriteria.correlationId}`;
      }
    }

    try {
      yield put(
        UpdateIndicator({
          show: true,
          message: 'Loading...',
        }),
      );
      const { data } = yield call(axios.get, eventUrl, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });

      yield put(getEventLogEntriesSucceeded(data['event-service']['event'], data.page.after, data.page.next));

      yield put(
        UpdateIndicator({
          show: false,
        }),
      );
    } catch {
      yield put(getEventLogEntriesFailed());
      yield put(
        ErrorNotification({
          error: {
            message: 'Search request timed out. Try narrowing your search criteria or using a different time range.',
          },
        }),
      );
      yield put(
        UpdateIndicator({
          show: false,
        }),
      );
    }
  }
}

const EVENT_LOG_REQUEST_TIMEOUT_MS = 30000;

// Only the filters the event service count endpoint supports, so the total always matches the pages.
const toEventLogQuery = (criteria: EventSearchCriteria): Record<string, string> => {
  const query: Record<string, string> = {};
  const context: Record<string, unknown> = {
    ...(criteria?.namespace && { namespace: criteria.namespace }),
    ...(criteria?.name && { name: criteria.name }),
    ...criteria?.context,
  };
  if (Object.keys(context).length > 0) {
    query.context = JSON.stringify(context);
  }
  if (criteria?.timestampMin) {
    query.timestampMin = new Date(criteria.timestampMin).toISOString();
  }
  if (criteria?.timestampMax) {
    query.timestampMax = new Date(criteria.timestampMax).toISOString();
  }
  if (criteria?.correlationId) {
    query.correlationId = criteria.correlationId;
  }

  return query;
};

// Mirrors the value service cursor (core-common encodeNext): a base64 encoded row offset.
const toOffsetCursor = (offset: number): string => btoa(`${offset}`);

// Pages in the older half are read oldest first, so no request skips more than half of the matching events.
const toEventLogPageWindow = (page: number, total?: number) => {
  const start = (page - 1) * EVENT_LOG_PAGE_SIZE;
  if (!total || start < total / 2) {
    return { order: 'desc', offset: start, top: EVENT_LOG_PAGE_SIZE };
  }
  const end = Math.min(start + EVENT_LOG_PAGE_SIZE, total);
  return { order: 'asc', offset: total - end, top: end - start };
};

export function* fetchEventLogPage({ page, searchCriteria, includeTotal }: FetchEventLogPageAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const eventServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.eventServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const total: number = includeTotal ? undefined : yield select((state: RootState) => state.event.logPage?.total);

  if (baseUrl && eventServiceUrl && token) {
    const eventsUrl = `${baseUrl}/value/v1/event-service/values/event`;
    const query = toEventLogQuery(searchCriteria);
    const headers = { Authorization: `Bearer ${token}` };
    const { order, offset, top } = toEventLogPageWindow(page, total);

    try {
      yield put(UpdateIndicator({ show: true, message: 'Loading...' }));
      const [{ data }, countResponse] = yield all([
        call(axios.get, eventsUrl, {
          headers,
          params: { ...query, top, after: toOffsetCursor(offset), order },
          timeout: EVENT_LOG_REQUEST_TIMEOUT_MS,
        }),
        includeTotal
          ? call(axios.get, `${eventServiceUrl}/event/v1/events/count`, {
              headers,
              params: query,
              timeout: EVENT_LOG_REQUEST_TIMEOUT_MS,
            })
          : null,
      ]);

      const events = data['event-service']['event'];
      yield put(
        getEventLogPageSucceeded(order === 'asc' ? [...events].reverse() : events, page, countResponse?.data.count),
      );
      yield put(UpdateIndicator({ show: false }));
    } catch (error) {
      yield put(getEventLogEntriesFailed());
      yield put(
        ErrorNotification({
          message: 'Failed to load the event log. Try narrowing your search criteria or using a different time range.',
          error,
        }),
      );
      yield put(UpdateIndicator({ show: false }));
    }
  }
}

export function* fetchEventMetrics(): SagaIterator {
  const metric = 'total:count';
  yield* fetchServiceMetrics(
    metric,
    function* (metrics) {
      const data = metrics[metric];
      const sum = data?.values.reduce((s, v) => parseInt(v.sum) + s, 0) || 0;

      yield put(
        fetchEventMetricsSucceeded({
          totalEvents: sum,
          avgPerDay: data?.values.length ? sum / data?.values.length : 0,
        }),
      );
    },
    'daily',
  );
}

export function* watchEventSagas(): Generator {
  yield takeEvery(FETCH_EVENT_DEFINITIONS_ACTION, fetchEventDefinitions);
  yield takeEvery(FETCH_EVENT_LOG_ENTRIES_ACTION, fetchEventLogEntries);
  yield takeLatest(FETCH_EVENT_LOG_PAGE_ACTION, fetchEventLogPage);
  yield takeEvery(UPDATE_EVENT_DEFINITION_ACTION, updateEventDefinition);
  yield takeEvery(DELETE_EVENT_DEFINITION_ACTION, deleteEventDefinition);
  yield takeLatest(FETCH_EVENT_METRICS_ACTION, fetchEventMetrics);
}
