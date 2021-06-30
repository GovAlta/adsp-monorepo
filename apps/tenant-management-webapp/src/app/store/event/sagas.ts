import axios from 'axios';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { RootState } from '..';
import {
  FetchEventDefinitionsAction,
  FetchEventLogEntriesAction,
  FETCH_EVENT_DEFINITIONS_ACTION,
  FETCH_EVENT_LOG_ENTRIES_ACTION,
  getEventDefinitionsSuccess,
  getEventLogEntriesSucceeded,
  UpdateEventDefinitionAction,
  updateEventDefinitionSuccess,
  UPDATE_EVENT_DEFINITION_ACTION,
} from './actions';

export function* fetchEventDefinitions(action: FetchEventDefinitionsAction) {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.tenantManagementApi);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const { data: tenantData } = yield call(axios.get, `${baseUrl}/api/configuration/v1/tenantConfig/event-service`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const configuration = tenantData?.configuration;
      const tenantDefinitions = Object.getOwnPropertyNames(configuration || {}).reduce((defs, namespace) => {
        Object.getOwnPropertyNames(configuration[namespace].definitions).forEach((name) => {
          defs.push({ ...configuration[namespace].definitions[name], namespace, isCore: false });
        });
        return defs;
      }, []);

      const { data: result } = yield call(
        axios.get,
        `${baseUrl}/api/configuration/v1/serviceOptions/event-service/v1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const serviceData = result?.configOptions || {};

      const serviceDefinitions = Object.getOwnPropertyNames(serviceData).reduce((defs, namespace) => {
        Object.getOwnPropertyNames(serviceData[namespace].definitions).forEach((name) => {
          defs.push({ ...serviceData[namespace].definitions[name], namespace, isCore: true });
        });
        return defs;
      }, []);

      yield put(getEventDefinitionsSuccess([...tenantDefinitions, ...serviceDefinitions]));
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* updateEventDefinition(action: UpdateEventDefinitionAction) {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.tenantManagementApi);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const { data: settings } = yield call(axios.get, `${baseUrl}/api/configuration/v1/tenantConfig/event-service`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const configuration = settings.configuration || {};
      configuration[action.definition.namespace] = {
        ...(settings[action.definition.namespace] || {}),
        definitions: {
          ...(settings[action.definition.namespace]?.definitions || {}),
          [action.definition.name]: {
            name: action.definition.name,
            description: action.definition.description,
            payloadSchema: action.definition.payloadSchema,
          },
        },
      };

      const { data } = yield call(
        axios.put,
        `${baseUrl}/api/configuration/v1/tenantConfig/event-service`,
        { configuration },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(
        updateEventDefinitionSuccess({
          ...data.configuration[action.definition.namespace].definitions[action.definition.name],
          namespace: action.definition.namespace,
          isCore: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* fetchEventLogEntries(action: FetchEventLogEntriesAction) {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const { data } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event?top=10&after=${action.after || ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(getEventLogEntriesSucceeded(data['event-service']['event'], data.page.after, data.page.next));
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* watchEventSagas() {
  yield takeEvery(FETCH_EVENT_DEFINITIONS_ACTION, fetchEventDefinitions);
  yield takeEvery(FETCH_EVENT_LOG_ENTRIES_ACTION, fetchEventLogEntries);
  yield takeEvery(UPDATE_EVENT_DEFINITION_ACTION, updateEventDefinition);
}
