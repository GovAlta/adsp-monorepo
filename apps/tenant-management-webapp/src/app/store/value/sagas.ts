import axios from 'axios';
import { select, call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { RootState } from '..';
import {
  CreateValueDefinitionAction,
  CREATE_VALUE_DEFINITION_ACTION,
  DeleteValueDefinitionAction,
  deleteValueDefinitionSuccess,
  DELETE_VALUE_DEFINITION_ACTION,
  FetchValueDefinitionsAction,
  FetchValueLogEntriesAction,
  fetchValueMetricsSucceeded,
  FETCH_VALUE_DEFINITIONS_ACTION,
  FETCH_VALUE_LOG_ENTRIES_ACTION,
  FETCH_VALUE_METRICS_ACTION,
  getValueDefinitionsSuccess,
  getValueLogEntriesSucceeded,
  UpdateValueDefinitionAction,
  updateValueDefinitionSuccess,
  UPDATE_VALUE_DEFINITION_ACTION,
} from './actions';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import moment from 'moment';
import { getAccessToken } from '@store/tenant/sagas';
import type { ValueDefinition } from './models';

interface ValueNamespaceResponse {
  definitions: Record<string, Omit<ValueDefinition, 'namespace' | 'isCore'>>;
}

const toValueDefinitions = (namespaces: Record<string, ValueNamespaceResponse>, isCore: boolean): ValueDefinition[] =>
  Object.entries(namespaces || {}).flatMap(([namespace, { definitions }]) =>
    Object.values(definitions || {}).map((definition) => ({ ...definition, namespace, isCore }))
  );

const toDefinitionRequest = ({ name, description, jsonSchema }: ValueDefinition) => ({
  name,
  description,
  jsonSchema,
});

const getDefinitionUrl = (baseUrl: string, { namespace, name }: ValueDefinition) =>
  `${baseUrl}/value/v1/definitions/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;

export function* fetchValueDefinitions(_action: FetchValueDefinitionsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { data } = yield call(axios.get, `${baseUrl}/value/v1/definitions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(
        getValueDefinitionsSuccess([...toValueDefinitions(data.tenant, false), ...toValueDefinitions(data.core, true)])
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  }
}

export function* createValueDefinition({ definition }: CreateValueDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { data } = yield call(
        axios.post,
        `${baseUrl}/value/v1/definitions`,
        { namespace: definition.namespace, ...toDefinitionRequest(definition) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      yield put(updateValueDefinitionSuccess(data));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* updateValueDefinition({ definition }: UpdateValueDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { data } = yield call(axios.patch, getDefinitionUrl(baseUrl, definition), toDefinitionRequest(definition), {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(updateValueDefinitionSuccess(data));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* deleteValueDefinition({ definition }: DeleteValueDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      yield call(axios.delete, getDefinitionUrl(baseUrl, definition), {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(deleteValueDefinitionSuccess(definition));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* fetchValueLogEntries(action: FetchValueLogEntriesAction): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);
  let valueUrl = `${baseUrl}/value/v1/value-service/values/value?top=${action.searchCriteria?.top || 10}&after=${
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
        valueUrl = `${valueUrl}&context=${JSON.stringify(contextObj)}`;
      }

      if (action.searchCriteria.timestampMax) {
        const maxDate = new Date(action.searchCriteria.timestampMax);
        valueUrl = `${valueUrl}&timestampMax=${maxDate.toISOString()}`;
      }
      if (action.searchCriteria.applications) {
        valueUrl = `${valueUrl}&value=${action.searchCriteria.applications}`;
      }
      if (action.searchCriteria.url) {
        valueUrl = `${valueUrl}&url=${action.searchCriteria.url}`;
      }
      if (action.searchCriteria.timestampMin) {
        const minDate = new Date(action.searchCriteria.timestampMin);
        valueUrl = `${valueUrl}&timestampMin=${minDate.toISOString()}`;
      }
      if (action.searchCriteria.correlationId) {
        valueUrl = `${valueUrl}&correlationId=${action.searchCriteria.correlationId}`;
      }
    }

    try {
      yield put(
        UpdateIndicator({
          show: true,
          message: 'Loading...',
        })
      );
      const { data } = yield call(axios.get, valueUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(getValueLogEntriesSucceeded(data['value-service']['value'], data.page.after, data.page.next));

      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

interface MetricResponse {
  values: { sum: string }[];
}

export function* fetchValueMetrics(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().startOf('week').toISOString(),
      });

      const { data }: { data: MetricResponse } = yield call(
        axios.get,
        `${baseUrl}/value/v1/value-service/values/value/metrics/total:count?interval=daily&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sum = data.values.reduce((s, v) => parseInt(v.sum) + s, 0) || 0;

      yield put(
        fetchValueMetricsSucceeded({
          totalValues: sum,
          avgPerDay: data.values.length ? sum / data.values.length : 0,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* watchValueSagas(): Generator {
  yield takeEvery(FETCH_VALUE_DEFINITIONS_ACTION, fetchValueDefinitions);
  yield takeEvery(FETCH_VALUE_LOG_ENTRIES_ACTION, fetchValueLogEntries);
  yield takeEvery(CREATE_VALUE_DEFINITION_ACTION, createValueDefinition);
  yield takeEvery(UPDATE_VALUE_DEFINITION_ACTION, updateValueDefinition);
  yield takeEvery(DELETE_VALUE_DEFINITION_ACTION, deleteValueDefinition);
  yield takeLatest(FETCH_VALUE_METRICS_ACTION, fetchValueMetrics);
}
