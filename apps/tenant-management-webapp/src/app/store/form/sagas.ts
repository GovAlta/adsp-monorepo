import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery, delay } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import {
  UpdateFormDefinitionsAction,
  getFormDefinitionsSuccess,
  updateFormDefinitionSuccess,
  FETCH_FORM_DEFINITIONS_ACTION,
  UPDATE_FORM_DEFINITION_ACTION,
  DELETE_FORM_DEFINITION_ACTION,
  DeleteFormDefinitionAction,
  deleteFormById,
} from './action';

import { getAccessToken } from '@store/tenant/sagas';
import { fetchFormDefinitionsApi, updateFormDefinitionApi, deleteFormDefinitionApi } from './api';

export function* fetchFormDefinitions(payload): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  const next = payload.next ?? '';
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/form-service?top=10&after=${next}`;
      const { results, page } = yield call(fetchFormDefinitionsApi, token, url);

      const definitions = results.reduce((acc, def) => {
        if (def.latest?.configuration?.id) {
          acc[def.latest.configuration.id] = def.latest.configuration;
        } else {
          acc[def.id] = def.latest.configuration;
        }

        return acc;
      }, {});

      yield put(getFormDefinitionsSuccess(definitions, page.next, page.after));
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

export function* updateFormDefinition({ definition }: UpdateFormDefinitionsAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { latest } = yield call(updateFormDefinitionApi, token, baseUrl, definition);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loadedDefinitions = yield select((state: RootState) => state.form.definitions);

      loadedDefinitions[latest.configuration.id] = latest.configuration;
      yield put(updateFormDefinitionSuccess(loadedDefinitions));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* deleteFormDefinition({ definition }: DeleteFormDefinitionAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Deleting Definition...',
    })
  );
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);
  if (baseUrl && token) {
    try {
      yield call(deleteFormDefinitionApi, token, baseUrl, definition.id);
      yield put(deleteFormById(definition.id));
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

export function* watchFormSagas(): Generator {
  yield takeEvery(FETCH_FORM_DEFINITIONS_ACTION, fetchFormDefinitions);
  yield takeEvery(UPDATE_FORM_DEFINITION_ACTION, updateFormDefinition);
  yield takeEvery(DELETE_FORM_DEFINITION_ACTION, deleteFormDefinition);
}
