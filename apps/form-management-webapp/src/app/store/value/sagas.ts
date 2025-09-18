import axios from 'axios';
import { select, call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { RootState } from '..';
import {
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

export function* fetchValueDefinitions(_action: FetchValueDefinitionsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const { data: configuration } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/value-service/latest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const tenantDefinitions = Object.getOwnPropertyNames(configuration || {}).reduce((defs, namespace) => {
        Object.getOwnPropertyNames(configuration[namespace].definitions).forEach((name) => {
          defs.push({ ...configuration[namespace].definitions[name], namespace, isCore: false });
        });
        return defs;
      }, []);

      const { data: serviceData = {} } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/value-service/latest?core`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const serviceDefinitions = Object.getOwnPropertyNames(serviceData).reduce((defs, namespace) => {
        Object.getOwnPropertyNames(serviceData[namespace].definitions).forEach((name) => {
          defs.push({ ...serviceData[namespace].definitions[name], namespace, isCore: true });
        });
        return defs;
      }, []);

      yield put(getValueDefinitionsSuccess([...tenantDefinitions, ...serviceDefinitions]));
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

export function* updateValueDefinition({ definition }: UpdateValueDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { data: configuration } = yield call(
        axios.get,
        `${baseUrl}/configuration/v2/configuration/platform/value-service/latest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const namespaceUpdate = {
        name: definition.namespace,
        definitions: {
          ...(configuration[definition.namespace]?.definitions || {}),
          [definition.name]: {
            name: definition.name,
            description: definition.description,
            jsonSchema: definition.jsonSchema,
          },
        },
      };

      const {
        data: { latest },
      } = yield call(
        axios.patch,
        `${baseUrl}/configuration/v2/configuration/platform/value-service`,
        { operation: 'UPDATE', update: { [definition.namespace]: namespaceUpdate } },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(
        updateValueDefinitionSuccess({
          ...latest.configuration[definition.namespace].definitions[definition.name],
          namespace: definition.namespace,
          isCore: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* deleteValueDefinition({ definition }: UpdateValueDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { data: configuration } = yield call(
        axios.get,
        `${baseUrl}/configuration/v2/configuration/platform/value-service/latest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const headers = { Authorization: `Bearer ${token}` };
      const configPatchUrl = `${baseUrl}/configuration/v2/configuration/platform/value-service`;

      const namespaceUpdate = configuration[definition.namespace];
      delete namespaceUpdate['definitions'][definition.name];

      if (Object.keys(namespaceUpdate['definitions']).length === 0) {
        yield call(
          axios.patch,
          configPatchUrl,
          { operation: 'DELETE', property: definition.namespace },
          {
            headers,
          }
        );
      } else {
        yield call(
          axios.patch,
          configPatchUrl,
          { operation: 'UPDATE', update: { [definition.namespace]: namespaceUpdate } },
          {
            headers,
          }
        );
      }

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
  yield takeEvery(UPDATE_VALUE_DEFINITION_ACTION, updateValueDefinition);
  yield takeEvery(DELETE_VALUE_DEFINITION_ACTION, deleteValueDefinition);
  yield takeLatest(FETCH_VALUE_METRICS_ACTION, fetchValueMetrics);
}
