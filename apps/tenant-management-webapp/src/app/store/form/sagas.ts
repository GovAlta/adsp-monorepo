import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { tryResolveRefs } from '@abgov/jsonforms-components';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { ajv } from '@lib/validation/checkInput';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { ErrorNotification } from '@store/notifications/actions';
import { fetchServiceMetrics } from '@store/common';
import { getAccessToken } from '@store/tenant/sagas';
import { select, call, put, takeEvery, delay, takeLatest, all } from 'redux-saga/effects';
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
  getExportFormInfoSuccess,
  TagResourceAction,
  UnTagResourceAction,
  FetchResourceTagsAction,
  FetchTagByTagNameAction,
  fetchFormResourceTagsSuccess,
  fetchFormTagByTagNameFailed,
  fetchFormTagByTagNameSuccess,
  TAG_FORM_RESOURCE_ACTION,
  UNTAG_FORM_RESOURCE_ACTION,
  FETCH_FORM_RESOURCE_TAGS_ACTION,
  FETCH_FORM_TAG_BY_TAG_NAME_ACTION,
  FETCH_ALL_TAGS_ACTION,
  fetchAllTagsSuccess,
  fetchAllTagsFailed,
  FetchResourcesByTagAction,
  fetchResourcesByTagSuccess,
  FETCH_RESOURCES_BY_TAG_ACTION,
  FETCH_RESOURCES_BY_TAG_SUCCESS,
  DELETE_RESOURCE_TAGS,
  DeleteResourceTagsAction,
  deleteResourceSuccessTags,
  clearAllTags,
  INITIALIZE_FORM_EDITOR,
  FETCH_FORM_DEFINITIONS_REGISTER_ID_ACTION,
} from './action';
import {
  fetchFormDefinitionsApi,
  updateFormDefinitionApi,
  deleteFormDefinitionApi,
  fetchFormDefinitionApi,
  exportApi,
} from './api';
import { FormDefinition, FormResourceTagResponse, FormResourceTagResult, Tag } from './model';
import { ResourceTagRequest } from '@store/directory/models';
import {
  getResourceTagsApi,
  getTagByNameApi,
  tagResourceApi,
  unTagResourceApi,
  getAllTagsApi,
  deleteResourceTagsApi,
} from '@store/directory/api';
import { getResourcesByTag } from '../directory/api';
import { toKebabName } from '@lib/kebabName';

import { FetchRealmRoles } from '@store/tenant/actions';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { getTaskQueues } from '@store/task/action';
import { FetchFileTypeService } from '@store/file/actions';
import { fetchCalendars } from '@store/calendar/actions';
import { AGENT_RESPONSE_ACTION, AgentResponseAction } from '../agent/actions';

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

// export function* fetchFormDefinitionsRegisterId(payload): SagaIterator {
//   const configBaseUrl: string = yield select(
//     (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
//   );
//   const token: string = yield call(getAccessToken);
//   const registeredId = payload.registeredId;
//   if (configBaseUrl && token) {
//     try {
//       const url = `${configBaseUrl}/configuration/v2/configuration/form-service?top=1&registeredId=${registeredId}`;
//       const { results, page } = yield call(fetchFormDefinitionsApi, token, url);
//       yield put(
//         UpdateIndicator({
//           show: true,
//         })
//       );

//     } catch (err) {
//       yield put(ErrorNotification({ error: err }));
//       yield put(
//         UpdateIndicator({
//           show: false,
//         })
//       );
//     }
//   }
// }

export function* exportFormInfo(payload): SagaIterator {
  const exportBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.exportServiceUrl);
  const token: string = yield call(getAccessToken);
  try {
    if (exportBaseUrl && token) {
      const url = `${exportBaseUrl}/export/v1/jobs`;
      const requestBody = {
        resourceId: `urn:ads:platform:form-service:v1:/${payload?.resource}`,
        format: payload.format,
        params: {
          criteria: JSON.stringify({
            definitionIdEquals: payload?.id,
          }),
          includeData: true,
        },
        filename: `${payload.fileNamePrefix}-${new Date().toISOString().replace(/[:.]/g, '-')}`,
        ...(payload.format === 'csv' && { formatOptions: { columns: payload.selectedColumn } }),
      };

      const exportResult = yield call(exportApi, token, url, requestBody);
      yield put(getExportFormInfoSuccess(exportResult));
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

export function* tagFormResource({ tag, isTagAdded }: TagResourceAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Add a tag...',
    })
  );

  const state: RootState = yield select();
  const baseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;

  const token: string = yield call(getAccessToken);
  if (baseUrl && token) {
    try {
      const tagResourceRequest = {
        tag: {
          label: tag.label,
        },
        resource: {
          urn: tag.urn,
        },
      } as ResourceTagRequest;
      const data = yield call(tagResourceApi, token, baseUrl, tagResourceRequest);
      if (data && !isTagAdded) {
        yield put(clearAllTags());
        yield call(fetchAllTags);
      }
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: 'Failed to add tag', error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* unTagFormResource({ payload }: UnTagResourceAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'untag resource...',
    })
  );

  const state: RootState = yield select();
  const baseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;

  const token: string = yield call(getAccessToken);
  if (baseUrl && token) {
    try {
      yield call(unTagResourceApi, token, baseUrl, payload);
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: 'Failed to un tag a resource', error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}
export function* fetchFormResourceTags({ payload }: FetchResourceTagsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Fetch resource tags...',
    })
  );

  const state: RootState = yield select();
  const baseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;

  const token: string = yield call(getAccessToken);
  if (baseUrl && token) {
    try {
      const { results } = yield call(getResourceTagsApi, token, baseUrl, payload);
      const response: FormResourceTagResponse = {
        formDefinitionId: payload.split('/').at(-1),
        resourceTags: results,
      };
      yield put(fetchFormResourceTagsSuccess(response));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: 'Failed to fetch resource tags', error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* fetchFormTagByTagName({ payload }: FetchTagByTagNameAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Get tag by tag name...',
    })
  );

  const state: RootState = yield select();
  const baseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  const token: string = yield call(getAccessToken);

  try {
    const data = yield call(getTagByNameApi, token, baseUrl, payload);
    yield put(fetchFormTagByTagNameSuccess(data));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  } catch (err) {
    //Tag not found response
    if (err?.response?.status === 404) {
      yield put(fetchFormTagByTagNameFailed(null));
    } else {
      yield put(ErrorNotification({ message: 'Failed to fetch tag', error: err }));
    }
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  }
}

export function* fetchAllTags(): SagaIterator {
  try {
    const state: RootState = yield select();
    const baseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl || '';
    const token: string = yield call(getAccessToken);

    if (baseUrl && token) {
      const { results } = yield call(getAllTagsApi, token, baseUrl);
      const tags: Tag[] = results.map((tag: FormResourceTagResult) => ({
        urn: tag.urn,
        label: tag.label,
        value: tag.value.toLowerCase(),
        _links: tag._links,
      }));

      yield put(fetchAllTagsSuccess(tags));
    } else {
      throw new Error('Missing token or base URL');
    }
  } catch (err) {
    yield put(fetchAllTagsFailed(err.message));
    yield put(ErrorNotification({ message: 'Failed to fetch tags', error: err }));
  }
}

export function* fetchResourcesByTag({ tag, next, criteria }: FetchResourcesByTagAction): SagaIterator {
  if (!tag) {
    console.log('Skipping fetchResourcesByTag - No tag selected');
    yield put({
      type: FETCH_RESOURCES_BY_TAG_SUCCESS,
      payload: { tag: '', resources: [] },
    });
    return;
  }

  const requiredTag = toKebabName(tag);

  yield put(UpdateIndicator({ show: true, message: `Fetching form definitions for tag: ${tag}...` }));

  const state: RootState = yield select();
  const baseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { results, page } = yield call(getResourcesByTag, token, baseUrl, requiredTag, criteria, next);

      if (results && results?.length === 0) {
        yield put(UpdateIndicator({ show: false }));
        yield put(fetchResourcesByTagSuccess(tag, null, page.next, page.after));
        return;
      }
      const filteredFormDefinitions = results.reduce((acc, def) => {
        const { urn, _embedded } = def;

        const represents = _embedded?.represents?.latest?.configuration;
        if (represents) {
          acc[represents.id] = {
            urn,
            id: represents.id,
            name: represents.name,
            description: represents.description,
            dataSchema: represents.dataSchema,
            uiSchema: represents.uiSchema,
          };
        }
        return acc;
      }, {});

      yield put(UpdateIndicator({ show: false }));
      yield put(fetchResourcesByTagSuccess(tag, filteredFormDefinitions, page.next, page.after));
    } catch (err) {
      yield put(ErrorNotification({ message: `Failed to fetch resources for tag: ${tag}`, error: err }));
    }
  } else {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* deleteResourceTags({ urn, formDefinitionId }: DeleteResourceTagsAction): SagaIterator {
  try {
    const state: RootState = yield select();
    const baseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl || '';
    const token: string = yield call(getAccessToken);

    if (baseUrl && token) {
      const deleted = yield call(deleteResourceTagsApi, token, baseUrl, urn);
      if (deleted) {
        yield put(deleteResourceSuccessTags(urn, formDefinitionId));
      }
    } else {
      throw new Error('Missing token or base URL');
    }
  } catch (err) {
    yield put(ErrorNotification({ message: `Failed to delete tags from resource ${formDefinitionId}`, error: err }));
  }
}

export function* refreshDefinition(): SagaIterator {
  try {
    const editorSelectedId: string = yield select((state: RootState) => state.form.editor.selectedId);
    const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
    const token: string = yield call(getAccessToken);

    if (editorSelectedId && baseUrl && token) {
      const definition = yield call(fetchFormDefinitionApi, token, baseUrl, editorSelectedId);
      yield put(updateFormDefinitionSuccess(definition));
      yield put(openEditorForDefinitionSuccess(definition, false));
    }
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* refreshDefinitionOnAgentResponse({ threadId, done }: AgentResponseAction): SagaIterator {
  if (done) {
    const threads = yield select((state: RootState) => state.agent.threads);
    const thread = threads[threadId];
    if (thread?.agent === 'formGenerationAgent') {
      yield call(refreshDefinition);
    }
  }
}

function* initializeFormEditorSaga() {
  const realmRoles = yield select((state) => state.tenant.realmRoles);
  const keycloakRoles = yield select((state) => state.serviceRoles.keycloak);
  const queueTasks = yield select((state: RootState) => state.task?.queues);
  const fileTypes = yield select((state: RootState) => state.fileService.fileTypes);
  try {
    yield all([
      ...(realmRoles == null ? [put(FetchRealmRoles())] : []),
      ...(keycloakRoles == null ? [put(fetchKeycloakServiceRoles())] : []),
      ...(queueTasks == null ? [put(getTaskQueues())] : []),
      ...(fileTypes == null ? [put(FetchFileTypeService())] : []),
      put(fetchCalendars()),
    ]);
  } catch (e) {
    // handle error, e.g. dispatch failure action
    console.error('Initialization failed', e);
  }
}

export function* watchFormSagas(): Generator {
  yield takeLatest(INITIALIZE_FORM_EDITOR, initializeFormEditorSaga);
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

  yield takeEvery(DELETE_RESOURCE_TAGS, deleteResourceTags);
  yield takeEvery(TAG_FORM_RESOURCE_ACTION, tagFormResource);
  yield takeEvery(UNTAG_FORM_RESOURCE_ACTION, unTagFormResource);
  yield takeEvery(FETCH_FORM_RESOURCE_TAGS_ACTION, fetchFormResourceTags);
  yield takeEvery(FETCH_FORM_TAG_BY_TAG_NAME_ACTION, fetchFormTagByTagName);
  yield takeEvery(FETCH_ALL_TAGS_ACTION, fetchAllTags);
  yield takeLatest(FETCH_RESOURCES_BY_TAG_ACTION, fetchResourcesByTag);
  yield takeLatest(AGENT_RESPONSE_ACTION, refreshDefinitionOnAgentResponse);
}
