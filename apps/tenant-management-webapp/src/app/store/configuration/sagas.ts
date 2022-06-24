import axios from 'axios';
import {
  DeleteConfigurationDefinitionAction,
  deleteConfigurationDefinitionSuccess,
  DELETE_CONFIGURATION_DEFINITION_ACTION,
  FetchConfigurationsAction,
  FetchConfigurationDefinitionsAction,
  FETCH_CONFIGURATIONS_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  getConfigurationDefinitionsSuccess,
  getConfigurationsSuccess,
  UpdateConfigurationDefinitionAction,
  updateConfigurationDefinitionSuccess,
  UPDATE_CONFIGURATION_DEFINITION_ACTION,
  SetConfigurationRevisionAction,
  SET_CONFIGURATION_REVISION_ACTION,
  setConfigurationRevisionSuccessAction,
  ReplaceConfigurationDataAction,
  REPLACE_CONFIGURATION_DATA_ACTION,
  replaceConfigurationDataSuccessAction,
  REPLACE_CONFIGURATION_ERROR_ACTION,
  getReplaceConfigurationErrorSuccessAction,
  ResetReplaceConfigurationListAction,
  resetReplaceConfigurationListSuccessAction,
  RESET_REPLACE_CONFIGURATION_LIST_ACTION,
  ServiceId,
} from './action';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '..';
import { select, call, put, takeEvery, all } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { jsonSchemaCheck } from '@lib/checkInput';
import { getAccessToken } from '@store/tenant/sagas';

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

  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const { tenant, core } = yield all({
        tenant: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/configuration-service`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        core: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/configuration-service?core`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
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

export function* fetchConfigurations(action: FetchConfigurationsAction): SagaIterator {
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
  const urls = getFetchUrls(action.services, configBaseUrl);
  if (configBaseUrl && token && urls.length > 0) {
    try {
      const configs = yield all(
        urls.map((url) => call(axios.get, url, { headers: { Authorization: `Bearer ${token}` } }))
      );
      yield put(getConfigurationsSuccess(configs.map((c) => c.data)));
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

const getFetchUrls = (services: ServiceId[], configBaseUrl: string) => {
  const results: string[] = [];
  for (const service of services) {
    const url = `${configBaseUrl}/configuration/v2/configuration/${service.namespace}/${service.service}`;
    results.push(url);
  }
  return results;
};

export function* updateConfigurationDefinition({
  definition,
  isAddedFromOverviewPage,
}: UpdateConfigurationDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const namespaceUpdate = {
        configurationSchema: definition.configurationSchema,
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
            ...latest,
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
  const token: string = yield call(getAccessToken);

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

      yield put(deleteConfigurationDefinitionSuccess({ ...latest }));
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* setConfigurationRevision(action: SetConfigurationRevisionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const revision = yield call(
        axios.post,
        `${baseUrl}/configuration/v2/configuration/${action.request.namespace}/${action.request.name}`,
        {
          revision: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(setConfigurationRevisionSuccessAction(revision));
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

let replaceErrorConfiguration = [];
let replacedConfiguration = [];

export function* replaceConfigurationData(action: ReplaceConfigurationDataAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    if (action.configuration.configuration) {
      try {
        const body = {
          operation: 'REPLACE',
          configuration: action.configuration.configuration,
        };
        // Get Json schema from configuration definition
        let definition;
        if (action.configuration.namespace === 'platform') {
          const coreConfig = yield select(
            (state: RootState) => state.configuration.coreConfigDefinitions.configuration
          );
          definition = coreConfig[`${action.configuration.namespace}:${action.configuration.name}`];
        } else {
          const tenantConfig: string = yield select(
            (state: RootState) => state.configuration.tenantConfigDefinitions.configuration
          );
          definition = tenantConfig[`${action.configuration.namespace}:${action.configuration.name}`];
        }
        // Check if configuration item following definition
        const jsonSchemaValidation = jsonSchemaCheck(
          definition.configurationSchema,
          action.configuration.configuration
        );
        if (!jsonSchemaValidation) {
          replaceErrorConfiguration.push(`${action.configuration.namespace}:${action.configuration.name} `);
          return;
        }
        replacedConfiguration.push(`${action.configuration.namespace}:${action.configuration.name} `);

        // Send request to replace configuration
        yield call(
          axios.patch,
          `${baseUrl}/configuration/v2/configuration/${action.configuration.namespace}/${action.configuration.name}`,
          body,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        yield put(replaceConfigurationDataSuccessAction());
      } catch (err) {
        yield put(ErrorNotification({ message: err.message }));
      }
    } else {
      replaceErrorConfiguration.push(`${action.configuration.namespace}:${action.configuration.name} `);
    }
  }
}
export function* getReplaceList(action: SetConfigurationRevisionAction): SagaIterator {
  if (replaceErrorConfiguration.length > 0) {
    yield put(
      ErrorNotification({
        message: ` ${replaceErrorConfiguration}  configuration definition not match import configuration`,
      })
    );
  }

  if (replacedConfiguration.length > 0) {
    yield put(getReplaceConfigurationErrorSuccessAction(replacedConfiguration));
  }
  replaceErrorConfiguration = [];
  replacedConfiguration = [];
}

export function* resetReplaceList(action: ResetReplaceConfigurationListAction): SagaIterator {
  yield put(resetReplaceConfigurationListSuccessAction());
}
export function* watchConfigurationSagas(): Generator {
  yield takeEvery(FETCH_CONFIGURATION_DEFINITIONS_ACTION, fetchConfigurationDefinitions);
  yield takeEvery(UPDATE_CONFIGURATION_DEFINITION_ACTION, updateConfigurationDefinition);
  yield takeEvery(DELETE_CONFIGURATION_DEFINITION_ACTION, deleteConfigurationDefinition);
  yield takeEvery(FETCH_CONFIGURATIONS_ACTION, fetchConfigurations);
  yield takeEvery(SET_CONFIGURATION_REVISION_ACTION, setConfigurationRevision);
  yield takeEvery(REPLACE_CONFIGURATION_DATA_ACTION, replaceConfigurationData);
  yield takeEvery(REPLACE_CONFIGURATION_ERROR_ACTION, getReplaceList);
  yield takeEvery(RESET_REPLACE_CONFIGURATION_LIST_ACTION, resetReplaceList);
}
