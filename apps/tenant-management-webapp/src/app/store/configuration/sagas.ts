import axios from 'axios';
import {
  DeleteConfigurationDefinitionAction,
  deleteConfigurationDefinitionSuccess,
  DELETE_CONFIGURATION_ACTION,
  FetchConfigurationDefinitionsAction,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  getConfigurationDefinitionsSuccess,
  UpdateConfigurationDefinitionAction,
  updateConfigurationDefinitionSuccess,
  UPDATE_CONFIGURATION_DEFINITION_ACTION,
} from './action';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '..';
import { select, call, put, takeEvery, all } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';

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

export function* updateConfigurationDefinition({
  definition,
  isAddedFromOverviewPage,
}: UpdateConfigurationDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const namespaceUpdate = {
        configurationSchema: definition.payloadSchema,
      };
      const body = { operation: 'UPDATE', update: { [`${definition.namespace}:${definition.name}`]: namespaceUpdate } };
      const {
        data: { latest },
      } = yield call(axios.patch, `${baseUrl}/configuration/v2/configuration/platform/configuration-service`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      yield put(
        updateConfigurationDefinitionSuccess(
          {
            ...latest.configuration,
          },
          isAddedFromOverviewPage
        )
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* deleteConfigurationDefinition({ definitionName }: DeleteConfigurationDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const {
        data: { latest },
      } = yield call(
        axios.patch,
        `${baseUrl}/configuration/v2/configuration/platform/configuration-service`,
        { operation: 'DELETE', property: definitionName },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(deleteConfigurationDefinitionSuccess({ ...latest.configuration }));
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* watchConfigurationSagas(): Generator {
  yield takeEvery(FETCH_CONFIGURATION_DEFINITIONS_ACTION, fetchConfigurationDefinitions);
  yield takeEvery(UPDATE_CONFIGURATION_DEFINITION_ACTION, updateConfigurationDefinition);
  yield takeEvery(DELETE_CONFIGURATION_ACTION, deleteConfigurationDefinition);
}
