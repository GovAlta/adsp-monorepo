import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery, delay, takeLatest } from 'redux-saga/effects';
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
} from './action';

import { getAccessToken } from '@store/tenant/sagas';
import {
  fetchFormDefinitionsApi,
  updateFormDefinitionApi,
  deleteFormDefinitionApi,
  fetchFormDefinitionApi,
} from './api';
import { FormDefinition } from './model';
import { ajv } from '@lib/validation/checkInput';
import { JsonSchema } from '@jsonforms/core';

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

export function* watchFormSagas(): Generator {
  yield takeEvery(FETCH_FORM_DEFINITIONS_ACTION, fetchFormDefinitions);
  yield takeEvery(UPDATE_FORM_DEFINITION_ACTION, updateFormDefinition);
  yield takeEvery(DELETE_FORM_DEFINITION_ACTION, deleteFormDefinition);
  yield takeEvery(OPEN_EDITOR_FOR_DEFINITION_ACTION, openEditorForDefinition);
  yield takeLatest(SET_DRAFT_DATA_SCHEMA_ACTION, parseDataSchemaDraft);
  yield takeLatest(SET_DRAFT_UI_SCHEMA_ACTION, parseUISchemaDraft);
}
