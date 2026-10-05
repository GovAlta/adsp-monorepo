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
  updateLatestRevisionSuccessAction,
  REPLACE_CONFIGURATION_ERROR_ACTION,
  getReplaceConfigurationErrorSuccessAction,
  ResetReplaceConfigurationListAction,
  resetReplaceConfigurationListSuccessAction,
  RESET_REPLACE_CONFIGURATION_LIST_ACTION,
  FETCH_CONFIGURATION_REVISIONS_ACTION,
  FetchConfigurationRevisionsAction,
  FETCH_CONFIGURATION_ACTIVE_REVISION_ACTION,
  getConfigurationRevisionsSuccess,
  FetchConfigurationActionRevisionAction,
  getConfigurationActiveSuccess,
  SetConfigurationRevisionActiveAction,
  setConfigurationRevisionActiveSuccessAction,
  SET_CONFIGURATION_REVISION_ACTIVE_ACTION,
  ServiceId,
  FETCH_REGISTER_DATA_ACTION,
  getRegisterDataAction,
  getRegisterDataSuccessAction,
  getRegisterDataFailedAction,
  CREATE_DATA_REGISTER_ACTION,
  CreateDataRegisterAction,
  createDataRegisterSuccessAction,
  UPDATE_DATA_REGISTER_ACTION,
  UpdateDataRegisterAction,
  updateDataRegisterSuccessAction,
  DELETE_DATA_REGISTER_ACTION,
  DeleteDataRegisterAction,
  deleteDataRegisterSuccessAction,
} from './action';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator, UpdateLoadingState } from '@store/session/actions';
import { LoadingStateType } from '@store/session/models';
import { RootState } from '..';
import { select, call, put, takeEvery, takeLatest, all } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { jsonSchemaCheck } from '@lib/validation/checkInput';
import { getAccessToken } from '@store/tenant/sagas';
import * as HttpStatusCodes from 'http-status-codes';
import { toServiceKey } from '@pages/admin/services/configuration/export/ServiceConfiguration';
import { fetchRegistersApi, createRegisterApi, updateRegisterApi, deleteRegisterApi } from './dataRegisterApi';

export function* fetchConfigurationDefinitions(_action: FetchConfigurationDefinitionsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    }),
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl,
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
          tenant: {
            ...tenant.data,
            latest: { ...tenant.data?.latest, configuration: tenant.data?.latest?.configuration },
          },
          core: {
            ...core.data,
            latest: { ...core.data?.latest, configuration: core.data?.latest?.configuration },
          },
        }),
      );
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

async function fetchNameSpaceConfiguration(service: ServiceId, token: string, fetchUrl: string) {
  const configurations = [];
  let hasMoreData = true;
  let url = `${fetchUrl}`;

  while (hasMoreData) {
    const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    configurations.push(...data.results);
    if (data.page?.next) {
      url = `${fetchUrl}&after=${data.page.next}`;
    } else {
      hasMoreData = false;
    }
  }

  return configurations;
}

export function* fetchConfigurations(action: FetchConfigurationsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    }),
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl,
  );

  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token && action.services.length > 0) {
    try {
      const configs = yield all(
        action.services.map((service) => {
          const namespaceOnly = !service.service;
          let fetchUrl = `${configBaseUrl}/configuration/v2/configuration/${service.namespace}`;
          if (namespaceOnly) {
            fetchUrl = fetchUrl + '?top=10';

            return call(fetchNameSpaceConfiguration, service, token, fetchUrl);
          } else {
            fetchUrl = fetchUrl + `/${service.service}`;

            return call(axios.get, fetchUrl, { headers: { Authorization: `Bearer ${token}` } });
          }
        }),
      );

      const { coreConfigDefinitions, tenantConfigDefinitions } = yield select(
        (state: RootState) => state.configuration,
      );
      const definitions = { ...tenantConfigDefinitions?.configuration, ...coreConfigDefinitions?.configuration };
      yield put(
        getConfigurationsSuccess(
          configs
            .map((c) => {
              if (Array.isArray(c)) {
                return c;
              }
              const key = toServiceKey(c.data.namespace, c.data.name);
              if (definitions[key] && definitions[key]?.configurationSchema?.description) {
                c.data['description'] = definitions[key]?.configurationSchema?.description;
              }
              return c.data;
            })
            .flat(),
        ),
      );
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
export function* fetchConfigurationRevisions(action: FetchConfigurationRevisionsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    }),
  );
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl,
  );
  const token: string = yield call(getAccessToken);
  const service = action.service.split(':');
  const url = `${configBaseUrl}/configuration/v2/configuration/${service[0]}/${service[1]}/revisions?top=10&after=${
    action.after || ''
  }`;
  if (configBaseUrl && token) {
    try {
      const { data } = yield call(axios.get, url, { headers: { Authorization: `Bearer ${token}` } });

      yield put(getConfigurationRevisionsSuccess(data.results, action.service, data.page.after, data.page.next));
      yield put(
        UpdateIndicator({
          show: false,
        }),
      );
    } catch {
      yield put(getConfigurationRevisionsSuccess([], action.service));
      yield put(
        UpdateIndicator({
          show: false,
        }),
      );
    }
  }
}

export function* fetchRegisterData(): SagaIterator {
  const formApiUrl: string = yield select((state: RootState) => state.config.serviceUrls?.formAppApiUrl);
  const token: string = yield call(getAccessToken);

  // FETCH_REGISTER_DATA_ACTION turns the spinner on, so every exit path has to turn it off again.
  if (!formApiUrl || !token) {
    yield put(getRegisterDataFailedAction());
    return;
  }

  try {
    const registers = yield call(fetchRegistersApi, token, formApiUrl);
    yield put(getRegisterDataSuccessAction(registers));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
    yield put(getRegisterDataFailedAction());
  }
}

export function* createDataRegister(action: CreateDataRegisterAction): SagaIterator {
  const formApiUrl: string = yield select((state: RootState) => state.config.serviceUrls?.formAppApiUrl);
  const token: string = yield call(getAccessToken);

  if (formApiUrl && token) {
    try {
      const register = yield call(createRegisterApi, token, formApiUrl, {
        name: action.name,
        description: action.description,
        entries: action.entries,
      });
      yield put(createDataRegisterSuccessAction(register));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(getRegisterDataAction());
    }
  }
}

// The register editor stays open until this reports 'completed', so a failed save keeps the user's edits.
const updateRegisterLoadingState = (name: string, state: LoadingStateType) =>
  UpdateLoadingState({ name: UPDATE_DATA_REGISTER_ACTION, id: name, state });

export function* updateDataRegister(action: UpdateDataRegisterAction): SagaIterator {
  yield put(updateRegisterLoadingState(action.name, 'start'));

  const formApiUrl: string = yield select((state: RootState) => state.config.serviceUrls?.formAppApiUrl);
  const token: string = yield call(getAccessToken);

  if (!formApiUrl || !token) {
    yield put(updateRegisterLoadingState(action.name, 'error'));
    return;
  }

  try {
    const register = yield call(updateRegisterApi, token, formApiUrl, action.name, {
      description: action.description,
      entries: action.entries,
    });
    yield put(updateDataRegisterSuccessAction(register));
    yield put(updateRegisterLoadingState(action.name, 'completed'));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
    yield put(updateRegisterLoadingState(action.name, 'error'));
    yield put(getRegisterDataAction());
  }
}

export function* deleteDataRegister(action: DeleteDataRegisterAction): SagaIterator {
  const formApiUrl: string = yield select((state: RootState) => state.config.serviceUrls?.formAppApiUrl);
  const token: string = yield call(getAccessToken);

  if (formApiUrl && token) {
    try {
      yield call(deleteRegisterApi, token, formApiUrl, action.name);
      yield put(deleteDataRegisterSuccessAction(action.urn));
    } catch (err) {
      // A register already gone (e.g. deleted from another tab) is removed from state same as a successful delete.
      if (err.response?.status === HttpStatusCodes.NOT_FOUND) {
        yield put(deleteDataRegisterSuccessAction(action.urn));
      } else {
        yield put(ErrorNotification({ error: err }));
        yield put(getRegisterDataAction());
      }
    }
  }
}

export function* fetchConfigurationActiveRevision(action: FetchConfigurationActionRevisionAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl,
  );
  const token: string = yield call(getAccessToken);
  const service = action.service.split(':');
  const url = `${configBaseUrl}/configuration/v2/configuration/${service[0]}/${service[1]}/active`;
  if (configBaseUrl && token) {
    try {
      const { data } = yield call(axios.get, url, { headers: { Authorization: `Bearer ${token}` } });

      yield put(getConfigurationActiveSuccess(data, action.service));
    } catch {
      yield put(getConfigurationActiveSuccess(null, action.service));
    }
  }
}

export function* updateConfigurationDefinition({
  definition,
  isAddedFromOverviewPage,
  openEditor,
}: UpdateConfigurationDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const body = {
        operation: 'UPDATE',
        update: {
          [`${definition.namespace}:${definition.name}`]: {
            configurationSchema: definition.configurationSchema,
            description: definition.description,
            anonymousRead: definition.anonymousRead,
          },
        },
      };
      const {
        data: { latest },
      } = yield call(axios.patch, `${baseUrl}/configuration/v2/configuration/platform/configuration-service`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentId = openEditor ? `${definition.namespace}:${definition.name}` : null;
      yield put(
        updateConfigurationDefinitionSuccess(
          {
            ...latest,
          },
          isAddedFromOverviewPage,
          currentId,
        ),
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
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
        },
      );

      yield put(deleteConfigurationDefinitionSuccess({ ...latest }));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* setConfigurationRevision(action: SetConfigurationRevisionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  const service = action.service.split(':');
  if (baseUrl && token) {
    try {
      const revision = yield call(
        axios.post,
        `${baseUrl}/configuration/v2/configuration/${service[0]}/${service[1]}`,
        {
          operation: 'CREATE-REVISION',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      yield put(setConfigurationRevisionSuccessAction(action.service, revision));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}
export function* setConfigurationRevisionActive(action: SetConfigurationRevisionActiveAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  const service = action.service.split(':');
  if (baseUrl && token) {
    try {
      const revision = yield call(
        axios.post,
        `${baseUrl}/configuration/v2/configuration/${service[0]}/${service[1]}`,
        {
          operation: 'SET-ACTIVE-REVISION',
          setActiveRevision: action.setActiveRevision,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      yield put(setConfigurationRevisionActiveSuccessAction(action.service, revision));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}
let replaceErrorConfiguration = [];

export function* replaceConfigurationData(action: ReplaceConfigurationDataAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const coreConfig: Record<string, unknown> = yield select(
    (state: RootState) => state.configuration.coreConfigDefinitions.configuration,
  );
  const token: string = yield call(getAccessToken);
  let service = `${action.configuration.namespace}:${action.configuration.name}`;

  if (Object.keys(coreConfig).includes(action.configuration.namespace)) {
    service = `${action.configuration.namespace}`;
  }
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
          definition = coreConfig[service];
        } else {
          // March 24 Paul: we might need to sync with remote if the definition in the store is empty.
          const tenantConfig: string = yield select(
            (state: RootState) => state.configuration.tenantConfigDefinitions.configuration || {},
          );
          definition = tenantConfig[service];

          if (!definition) {
            definition = coreConfig[service];
          }
        }

        // Check if configuration item following definition
        const jsonSchemaValidation = jsonSchemaCheck(
          definition.configurationSchema,
          action.configuration.configuration,
        );
        if (!jsonSchemaValidation) {
          replaceErrorConfiguration.push({
            name: service,
            error: 'JSON schema could not be validated',
          });

          return;
        }

        let revision = null;
        if (action.isImportConfiguration) {
          // Import creates a new revision so there is a snapshot of pre-import revision.
          revision = yield call(
            axios.post,
            `${baseUrl}/configuration/v2/configuration/${action.configuration.namespace}/${action.configuration.name}`,
            {
              operation: 'CREATE-REVISION',
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          yield put(setConfigurationRevisionSuccessAction(service, revision));
        }
        // Send request to replace configuration
        //Import configuration replaces (REPLACE operation in PATCH) the configuration stored in latest revision
        yield call(
          axios.patch,
          `${baseUrl}/configuration/v2/configuration/${action.configuration.namespace}/${action.configuration.name}`,
          body,
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          },
        );
        yield put(
          UpdateIndicator({
            show: false,
          }),
        );
        if (action.isImportConfiguration) {
          yield put(replaceConfigurationDataSuccessAction(revision));
        } else {
          yield put(updateLatestRevisionSuccessAction(action.configuration));
        }
      } catch (err) {
        replaceErrorConfiguration.push({
          name: service,
          error: err.message,
        });
        yield put(getReplaceConfigurationErrorSuccessAction(replaceErrorConfiguration));
      }
    } else {
      replaceErrorConfiguration.push({
        name: service,
        error: 'Configuration is not set',
      });
    }
  }
}

export function* getReplaceList(_action: SetConfigurationRevisionAction): SagaIterator {
  if (replaceErrorConfiguration.length > 0) {
    yield put(getReplaceConfigurationErrorSuccessAction(replaceErrorConfiguration));
  }
}

export function* resetReplaceList(_action: ResetReplaceConfigurationListAction): SagaIterator {
  yield put(resetReplaceConfigurationListSuccessAction());
  replaceErrorConfiguration = [];
}

export function* watchConfigurationSagas(): Generator {
  yield takeEvery(FETCH_CONFIGURATION_DEFINITIONS_ACTION, fetchConfigurationDefinitions);
  yield takeEvery(UPDATE_CONFIGURATION_DEFINITION_ACTION, updateConfigurationDefinition);
  yield takeEvery(DELETE_CONFIGURATION_DEFINITION_ACTION, deleteConfigurationDefinition);
  yield takeEvery(FETCH_CONFIGURATIONS_ACTION, fetchConfigurations);
  yield takeEvery(SET_CONFIGURATION_REVISION_ACTION, setConfigurationRevision);
  yield takeEvery(SET_CONFIGURATION_REVISION_ACTIVE_ACTION, setConfigurationRevisionActive);
  yield takeEvery(REPLACE_CONFIGURATION_DATA_ACTION, replaceConfigurationData);
  yield takeEvery(REPLACE_CONFIGURATION_ERROR_ACTION, getReplaceList);
  yield takeEvery(RESET_REPLACE_CONFIGURATION_LIST_ACTION, resetReplaceList);
  yield takeEvery(FETCH_CONFIGURATION_REVISIONS_ACTION, fetchConfigurationRevisions);
  yield takeEvery(FETCH_CONFIGURATION_ACTIVE_REVISION_ACTION, fetchConfigurationActiveRevision);
  yield takeLatest(FETCH_REGISTER_DATA_ACTION, fetchRegisterData);
  yield takeEvery(CREATE_DATA_REGISTER_ACTION, createDataRegister);
  yield takeEvery(UPDATE_DATA_REGISTER_ACTION, updateDataRegister);
  yield takeEvery(DELETE_DATA_REGISTER_ACTION, deleteDataRegister);
}
