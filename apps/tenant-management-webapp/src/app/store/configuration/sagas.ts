import axios from 'axios';
import {
  FetchConfigurationDefinitionsAction,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  getConfigurationDefinitionsSuccess,
} from './action';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '..';
import { select, call, put, takeEvery, takeLatest, all } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { ConfigurationDefinitionTypes } from './model';

export function* fetchConfigurationDefinitions(action: FetchConfigurationDefinitionsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  if (configBaseUrl && token) {
    try {
      const { tenant, core } = yield all({
        tenant: call(
          axios.get,
          `${configBaseUrl}/configuration/v2/configuration/platform/configuration-service/latest`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        core: call(
          axios.get,
          `${configBaseUrl}/configuration/v2/configuration/platform/configuration-service/latest?core`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      });
      yield put(
        getConfigurationDefinitionsSuccess({
          tenant: tenant.data,
          core: core.data,
        })
      );
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}
export function* watchConfigurationSagas(): Generator {
  yield takeEvery(FETCH_CONFIGURATION_DEFINITIONS_ACTION, fetchConfigurationDefinitions);
}
