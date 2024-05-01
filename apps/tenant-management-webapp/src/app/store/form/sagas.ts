import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import {
  UpdateFormDefinitionsAction,
  getFormDefinitionsSuccess,
  updateFormDefinitionSuccess,
  FETCH_FORM_DEFINITIONS_ACTION,
  UPDATE_FORM_DEFINITION_ACTION,
  DELETE_FORM_DEFINITION_ACTION,
  deleteFormDefinitionSuccess,
  DeleteFormDefinitionAction,
  deleteFormById,
} from './action';

import { getAccessToken } from '@store/tenant/sagas';
import { UpdateFormConfig, DeleteFormConfig } from './model';
import { fetchFormDefinitionsApi, updateFormDefinitionApi, deleteFormDefinitionApi } from './api';

export function* fetchFormDefinitions(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Definition...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/platform/form-service/latest`;
      const Definitions = yield call(fetchFormDefinitionsApi, token, url);
      yield put(getFormDefinitionsSuccess(Definitions));
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

export function* updateFormDefinition({ definition }: UpdateFormDefinitionsAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const FormDefinition = {
        [definition.id]: {
          ...definition,
        },
      };

      const body: UpdateFormConfig = { operation: 'UPDATE', update: { ...FormDefinition } };
      const url = `${baseUrl}/configuration/v2/configuration/platform/form-service`;
      const { latest } = yield call(updateFormDefinitionApi, token, url, body);

      yield put(
        updateFormDefinitionSuccess({
          ...latest.configuration,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* deleteFormDefinition({ definition }: DeleteFormDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const payload: DeleteFormConfig = { operation: 'DELETE', property: definition.id };
      const url = `${baseUrl}/configuration/v2/configuration/platform/form-service`;
      yield put(deleteFormById(definition.id));
      yield call(deleteFormDefinitionApi, token, url, payload);
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* watchFormSagas(): Generator {
  yield takeEvery(FETCH_FORM_DEFINITIONS_ACTION, fetchFormDefinitions);
  yield takeEvery(UPDATE_FORM_DEFINITION_ACTION, updateFormDefinition);
  yield takeEvery(DELETE_FORM_DEFINITION_ACTION, deleteFormDefinition);
}
