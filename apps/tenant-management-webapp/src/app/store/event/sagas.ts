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
      const { data: tenantData } = yield call(axios.get, `${baseUrl}/api/configuration/v1/tenantConfig/eventService`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const tenantDefinitions = Object.getOwnPropertyNames(tenantData).reduce((defs, namespace) => {
        Object.getOwnPropertyNames(tenantData[namespace].definitions).forEach((name) => {
          defs.push(tenantData[namespace].definitions[name]);
        });
        return defs;
      }, []);

      const {
        data: { results },
      } = yield call(axios.get, `${baseUrl}/api/configuration/v1/serviceOptions?service=eventService&top=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const serviceData = results[0]?.configOptions || {};

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
      const { data: settings } = yield call(axios.get, `${baseUrl}/api/configuration/v1/tenantConfig/eventService`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      settings[action.definition.namespace] = {
        ...(settings[action.definition.namespace] || {}),
        [action.definition.name]: {
          name: action.definition.name,
          description: action.definition.description,
          payloadSchema: action.definition.payloadSchema,
        },
      };

      const { data } = yield call(axios.put, `${baseUrl}/api/configuration/v1/tenantConfig/eventService`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(updateEventDefinitionSuccess(data[action.definition.namespace][action.definition.name]));
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
