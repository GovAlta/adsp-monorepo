import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { tryResolveRefs } from '@abgov/jsonforms-components';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { ajv } from '@lib/validation/checkInput';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { ErrorNotification } from '@store/notifications/actions';
import { fetchServiceMetrics } from '@store/common';
import { getAccessToken } from '@store/tenant/sagas';
import { select, call, put, takeEvery, delay, takeLatest } from 'redux-saga/effects';
import { RootState } from '../index';
import { io, Socket } from 'socket.io-client';
import {
  UpdateFormDefinitionsAction,
  getFormDefinitionsSuccess,
  updateFormDefinitionSuccess,
  EXPORT_FORM_INFO_ACTION,
  FETCH_FORM_DEFINITIONS_ACTION,
  UPDATE_FORM_DEFINITION_ACTION,
  DELETE_FORM_DEFINITION_ACTION,
  DeleteFormDefinitionAction,
  deleteFormById,
  OpenEditorForDefinitionAction,
  OPEN_EDITOR_FOR_DEFINITION_ACTION,
  openEditorForDefinitionSuccess,
  SetDraftDataSchemaAction,
  SetDraftUISchemaAction,
  SET_DRAFT_DATA_SCHEMA_ACTION,
  SET_DRAFT_UI_SCHEMA_ACTION,
  processedDataSchema,
  processedUISchema,
  processDataSchemaFailed,
  processUISchemaFailed,
  openEditorForDefinitionFailed,
  ProcessDataSchemaSuccessAction,
  resolveDataSchemaFailed,
  resolvedDataSchema,
  PROCESS_DATA_SCHEMA_SUCCESS_ACTION,
  OPEN_EDITOR_FOR_DEFINITION_SUCCESS_ACTION,
  OpenEditorForDefinitionSuccessAction,
  fetchFormMetricsSuccess,
  FETCH_FORM_METRICS_ACTION,
  START_SOCKET_STREAM_ACTION,
  startSocketSuccess,
} from './action';
import {
  fetchFormDefinitionsApi,
  updateFormDefinitionApi,
  deleteFormDefinitionApi,
  fetchFormDefinitionApi,
  exportApi,
} from './api';
import { FormDefinition } from './model';

export function* fetchFormDefinitions(payload): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  const next = payload.next ?? '';
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/form-service?top=50&after=${next}`;
      const { results, page } = yield call(fetchFormDefinitionsApi, token, url);
      yield put(
        UpdateIndicator({
          show: true,
        })
      );
      const definitions = results.reduce((acc, def) => {
        if (def.latest?.configuration?.id) {
          acc[def.latest.configuration.id] = def.latest.configuration;
        } else {
          acc[def.id] = def.latest.configuration;
        }

        return acc;
      }, {});
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
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

export function* exportFormInfo(payload): SagaIterator {
  const exportBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.exportServiceUrl);
  const token: string = yield call(getAccessToken);

  try {
    if (exportBaseUrl && token) {
      const url = `${exportBaseUrl}/export/v1/jobs`;
      const requestBody = {
        resourceId: `urn:ads:platform:form-service:v1:/${payload.resource}`,
        format: 'json',
        params: {
          criteria: JSON.stringify({
            definitionIdEquals: payload.id,
          }),
          includeData: true,
        },
        filename: `Exports-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      };
      yield call(exportApi, token, url, requestBody);
    }
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  }
}
export function* startSocket(): SagaIterator {
  const token: string = yield call(getAccessToken);
  const pushServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pushServiceApiUrl);
  const socket: Socket = io(pushServiceUrl, {
    query: {
      stream: 'export-updates',
    },
    withCredentials: true,
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  yield put(startSocketSuccess(socket));
}

const ensureRolesAreUniqueWithNoDuplicates = (definition: FormDefinition) => {
  definition.applicantRoles = [...new Set(definition.applicantRoles)];
  definition.clerkRoles = [...new Set(definition.clerkRoles)];
  definition.assessorRoles = [...new Set(definition.assessorRoles)];

  return definition;
};

export function* updateFormDefinition({ definition }: UpdateFormDefinitionsAction): SagaIterator {
  const editorSelectedId: string = yield select((state: RootState) => state.form.editor.selectedId);
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      ensureRolesAreUniqueWithNoDuplicates(definition);

      const { latest } = yield call(updateFormDefinitionApi, token, baseUrl, definition);

      yield put(updateFormDefinitionSuccess(latest.configuration));

      // If the saved form definition is currently selected for editing, then update the editor state.
      if (definition.id && definition.id === editorSelectedId) {
        yield put(openEditorForDefinitionSuccess(latest.configuration, false));
      }
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

export function* openEditorForDefinition({ id, newDefinition }: OpenEditorForDefinitionAction): SagaIterator {
  try {
    if (!id) {
      throw new Error('Cannot open editor without form definition ID.');
    }

    // newDefinitions is set if editor is opened immediately for a new form definition.
    // Use it as a fallback value, since the new definition may or may not have already been created and set on the state.
    const definitions: Record<string, FormDefinition> = yield select((state: RootState) => state.form.definitions);
    let definition = definitions[id] || newDefinition;

    if (!definition) {
      const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
      const token: string = yield call(getAccessToken);

      if (baseUrl && token) {
        definition = yield call(fetchFormDefinitionApi, token, baseUrl, id);
      }

      if (!definition) {
        throw new Error(`Definition with ${id} not found.`);
      }
    }

    yield put(openEditorForDefinitionSuccess(definition, !!newDefinition));
  } catch (error) {
    yield put(openEditorForDefinitionFailed(id));
    yield put(ErrorNotification({ error }));
  }
}

export function* initializeDefinitionSchemas({ definition }: OpenEditorForDefinitionSuccessAction): SagaIterator {
  if (definition.dataSchema) {
    yield put(processedDataSchema(definition.dataSchema));
  }
  if (definition.uiSchema) {
    yield put(processedUISchema(definition.uiSchema as unknown as UISchemaElement));
  }
}

const hasProperties = (schema: JsonSchema): boolean => {
  return (
    (typeof schema === 'object' && Object.keys(schema).length === 0) ||
    ('properties' in schema && (('type' in schema && schema.type === 'object') || !('type' in schema)))
  );
};

export function* parseDataSchemaDraft({ draft }: SetDraftDataSchemaAction): SagaIterator {
  yield delay(1000);
  try {
    const parsedSchema = JSON.parse(draft);
    ajv.validateSchema(parsedSchema, true);
    if (Object.keys(parsedSchema).length > 0 && !hasProperties(parsedSchema)) {
      throw new Error('Data schema must have "properties"');
    }

    yield put(processedDataSchema(parsedSchema));
  } catch (err) {
    // failed parsing.
    yield put(processDataSchemaFailed(`${err}`));
  }
}

export function* parseUISchemaDraft({ draft }: SetDraftUISchemaAction): SagaIterator {
  yield delay(1000);
  try {
    const parsedSchema = JSON.parse(draft);
    yield put(processedUISchema(parsedSchema));
  } catch (err) {
    // failed parsing.
    yield put(processUISchemaFailed(`${err}`));
  }
}

export function* resolveDataSchema({ schema }: ProcessDataSchemaSuccessAction) {
  // JSON Forms doesn't handle remote $ref, so resolve to inline schema.
  // However, this is not the version we want to save.
  const [resolvedSchema, error] = yield call(tryResolveRefs, schema, standardV1JsonSchema, commonV1JsonSchema);
  if (error) {
    yield put(resolveDataSchemaFailed(`${error}`));
  } else {
    yield put(resolvedDataSchema(resolvedSchema));
  }
}

export function* fetchFormMetrics(): SagaIterator {
  yield* fetchServiceMetrics('form-service', function* (metrics) {
    const formsCreatedMetric = 'form-service:form-created:count';
    const formsSubmittedMetric = 'form-service:form-submitted:count';

    yield put(
      fetchFormMetricsSuccess({
        formsCreated: parseInt(metrics[formsCreatedMetric]?.values[0]?.sum || '0', 10),
        formsSubmitted: parseInt(metrics[formsSubmittedMetric]?.values[0]?.sum || '0', 10),
      })
    );
  });
}

export function* watchFormSagas(): Generator {
  yield takeEvery(FETCH_FORM_DEFINITIONS_ACTION, fetchFormDefinitions);
  yield takeEvery(EXPORT_FORM_INFO_ACTION, exportFormInfo);
  yield takeEvery(UPDATE_FORM_DEFINITION_ACTION, updateFormDefinition);
  yield takeEvery(DELETE_FORM_DEFINITION_ACTION, deleteFormDefinition);
  yield takeEvery(OPEN_EDITOR_FOR_DEFINITION_ACTION, openEditorForDefinition);
  yield takeLatest(OPEN_EDITOR_FOR_DEFINITION_SUCCESS_ACTION, initializeDefinitionSchemas);
  yield takeLatest(SET_DRAFT_DATA_SCHEMA_ACTION, parseDataSchemaDraft);
  yield takeLatest(SET_DRAFT_UI_SCHEMA_ACTION, parseUISchemaDraft);
  yield takeLatest(PROCESS_DATA_SCHEMA_SUCCESS_ACTION, resolveDataSchema);
  yield takeLatest(FETCH_FORM_METRICS_ACTION, fetchFormMetrics);
  yield takeEvery(START_SOCKET_STREAM_ACTION, startSocket);
}
