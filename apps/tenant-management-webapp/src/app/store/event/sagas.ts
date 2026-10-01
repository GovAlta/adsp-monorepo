import axios from 'axios';
import { select, call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { RootState } from '..';
import {
  deleteEventDefinitionSuccess,
  DELETE_EVENT_DEFINITION_ACTION,
  FetchEventDefinitionsAction,
  FetchEventLogEntriesAction,
  fetchEventMetricsSucceeded,
  FETCH_EVENT_DEFINITIONS_ACTION,
  FETCH_EVENT_LOG_ENTRIES_ACTION,
  FETCH_EVENT_METRICS_ACTION,
  getEventDefinitionsSuccess,
  getEventLogEntriesSucceeded,
  UpdateEventDefinitionAction,
  updateEventDefinitionSuccess,
  UPDATE_EVENT_DEFINITION_ACTION,
} from './actions';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { getAccessToken } from '@store/tenant/sagas';
import { fetchServiceMetrics } from '@store/common';
import { EventDefinition } from './models';

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
  yield takeEvery(UPDATE_EVENT_DEFINITION_ACTION, updateEventDefinition);
  yield takeEvery(DELETE_EVENT_DEFINITION_ACTION, deleteEventDefinition);
  yield takeLatest(FETCH_EVENT_METRICS_ACTION, fetchEventMetrics);
}
