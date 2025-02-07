import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  FormDefinition,
  FormMetrics,
  FormExportResponse,
  FormResourceTagResult,
  FormResourceTagResponse,
} from './model';
import { Socket } from 'socket.io-client';
import { ResourceTag } from '@store/directory/models';

export const CLEAR_FORM_DEFINITIONS_ACTION = 'form/CLEAR_FORM_DEFINITIONS_ACTION';
export const FETCH_FORM_DEFINITIONS_ACTION = 'form/FETCH_FORM_DEFINITIONS_ACTION';
export const FETCH_FORM_DEFINITIONS_SUCCESS_ACTION = 'form/FETCH_FORM_DEFINITIONS_SUCCESS_ACTION';

export const UPDATE_FORM_DEFINITION_ACTION = 'form/UPDATE_FORM_DEFINITION_ACTION';
export const UPDATE_FORM_DEFINITION_SUCCESS_ACTION = 'form/UPDATE_FORM_DEFINITION_SUCCESS_ACTION';

export const DELETE_FORM_DEFINITION_ACTION = 'form/DELETE_FORM_DEFINITION_ACTION';
export const DELETE_FORM_DEFINITION_SUCCESS_ACTION = 'form/DELETE_FORM_DEFINITION_SUCCESS_ACTION';
export const DELETE_FORM_BY_ID_ACTION = 'form/DELETE_FORM_BY_ID_ACTION';

export const OPEN_EDITOR_FOR_DEFINITION_ACTION = 'form/OPEN_EDITOR_FOR_DEFINITION_ACTION';
export const OPEN_EDITOR_FOR_DEFINITION_SUCCESS_ACTION = 'form/OPEN_EDITOR_FOR_DEFINITION_SUCCESS_ACTION';
export const OPEN_EDITOR_FOR_DEFINITION_FAILED_ACTION = 'form/OPEN_EDITOR_FOR_DEFINITION_FAILED_ACTION';

export const UPDATE_EDITOR_FORM_DEFINITION_ACTION = 'form/UPDATE_EDITOR_FORM_DEFINITION_ACTION';

export const SET_DRAFT_DATA_SCHEMA_ACTION = 'form/SET_DRAFT_DATA_SCHEMA_ACTION';
export const SET_DRAFT_UI_SCHEMA_ACTION = 'form/SET_DRAFT_UI_SCHEMA_ACTION';

export const PROCESS_DATA_SCHEMA_SUCCESS_ACTION = 'form/PROCESS_DATA_SCHEMA_SUCCESS_ACTION';
export const PROCESS_DATA_SCHEMA_FAILED_ACTION = 'form/PROCESS_DATA_SCHEMA_FAILED_ACTION';

export const PROCESS_UI_SCHEMA_SUCCESS_ACTION = 'form/PROCESS_UI_SCHEMA_SUCCESS_ACTION';
export const PROCESS_UI_SCHEMA_FAILED_ACTION = 'form/PROCESS_UI_SCHEMA_FAILED_ACTION';

export const RESOLVE_DATA_SCHEMA_SUCCESS_ACTION = 'form/RESOLVE_DATA_SCHEMA_SUCCESS_ACTION';
export const RESOLVE_DATA_SCHEMA_FAILED_ACTION = 'form/RESOLVE_DATA_SCHEMA_FAILED_ACTION';

export const FETCH_FORM_METRICS_ACTION = 'form/FETCH_FORM_METRICS_ACTION';
export const FETCH_FORM_METRICS_SUCCESS_ACTION = 'form/FETCH_FORM_METRICS_SUCCESS_ACTION';

export const EXPORT_FORM_INFO_ACTION = 'form/EXPORT_FORM_INFO_ACTION';
export const EXPORT_FORM_INFO_SUCCESS_ACTION = 'form/EXPORT_FORM_INFO_SUCCESS_ACTION';

export const START_SOCKET_STREAM_ACTION = 'form/START_SOCKET_STREAM_ACTION';
export const START_SOCKET_STREAM_SUCCESS_ACTION = 'form/START_SOCKET_STREAM_SUCCESS_ACTION';

export const TAG_FORM_RESOURCE_ACTION = 'form/resource/tag-resource';
export const TAG__FORM_RESOURCE_ACTION_SUCCESS = 'form/resource/tag-resource/success';

export const UNTAG_FORM_RESOURCE_ACTION = 'form/resource/untag-resource';
export const UNTAG_FORM_RESOURCE_ACTION_SUCCESS = 'form/resource/untag-resource/success';

export const FETCH_FORM_RESOURCE_TAGS_ACTION = 'form/resource/fetch-resource-tags';
export const FETCH_FORM_RESOURCE_TAGS_ACTION_SUCCESS = 'form/resource/fetch-resource-tags/success';

export const FETCH_FORM_TAG_BY_TAG_NAME_ACTION = 'form/resource/fetch-tag-by-tag-name';
export const FETCH_FORM_TAG_BY_TAG_NAME_ACTION_SUCCESS = 'form/resource/fetch-tag-by-tag-name/success';
export const FETCH_FORM_TAG_BY_TAG_NAME_ACTION_FAILED = 'form/resource/fetch-tag-by-tag-name/failed';

export interface ClearFormDefinitions {
  type: typeof CLEAR_FORM_DEFINITIONS_ACTION;
}
export interface FetchFormDefinitionsAction {
  type: typeof FETCH_FORM_DEFINITIONS_ACTION;
  next: string;
}

export interface FetchFormDefinitionsSuccessAction {
  type: typeof FETCH_FORM_DEFINITIONS_SUCCESS_ACTION;
  payload: Record<string, FormDefinition>;
  next: string;
  after: string;
}

export interface ExportFormInfoAction {
  type: typeof EXPORT_FORM_INFO_ACTION;
  id: string;
  resource: string;
  format: string;
  selectedColumn?: string[];
  fileNamePrefix?: string;
}

export interface ExportFormInfoSuccessAction {
  type: typeof EXPORT_FORM_INFO_SUCCESS_ACTION;
  payload: FormExportResponse;
}

export interface StartStreamAction {
  type: typeof START_SOCKET_STREAM_ACTION;
}
export interface StartStreamSuccessAction {
  type: typeof START_SOCKET_STREAM_SUCCESS_ACTION;
  socket: Socket;
}

export interface UpdateFormDefinitionsAction {
  type: typeof UPDATE_FORM_DEFINITION_ACTION;
  definition: FormDefinition;
  options?: string;
}

export interface UpdateFormDefinitionsSuccessAction {
  type: typeof UPDATE_FORM_DEFINITION_SUCCESS_ACTION;
  payload: FormDefinition;
}

export interface DeleteFormDefinitionAction {
  type: typeof DELETE_FORM_DEFINITION_ACTION;
  definition: FormDefinition;
}

export interface DeleteFormDefinitionSuccessAction {
  type: typeof DELETE_FORM_DEFINITION_SUCCESS_ACTION;
  payload: FormDefinition;
}

export interface DeleteFormByIDAction {
  type: typeof DELETE_FORM_BY_ID_ACTION;
  id: string;
}

export interface OpenEditorForDefinitionAction {
  type: typeof OPEN_EDITOR_FOR_DEFINITION_ACTION;
  id: string;
  newDefinition?: FormDefinition;
}

export interface OpenEditorForDefinitionSuccessAction {
  type: typeof OPEN_EDITOR_FOR_DEFINITION_SUCCESS_ACTION;
  definition: FormDefinition;
  isNew: boolean;
}

export interface OpenEditorForDefinitionFailedAction {
  type: typeof OPEN_EDITOR_FOR_DEFINITION_FAILED_ACTION;
  id: string;
}

export interface UpdateEditorFormDefinitionAction {
  type: typeof UPDATE_EDITOR_FORM_DEFINITION_ACTION;
  update: Partial<Omit<FormDefinition, 'dataSchema' | 'uiSchema'>>;
}

export interface SetDraftDataSchemaAction {
  type: typeof SET_DRAFT_DATA_SCHEMA_ACTION;
  draft: string;
}

export interface SetDraftUISchemaAction {
  type: typeof SET_DRAFT_UI_SCHEMA_ACTION;
  draft: string;
}

export interface ProcessDataSchemaSuccessAction {
  type: typeof PROCESS_DATA_SCHEMA_SUCCESS_ACTION;
  schema: JsonSchema;
}

export interface ProcessDataSchemaFailedAction {
  type: typeof PROCESS_DATA_SCHEMA_FAILED_ACTION;
  error: string;
}

export interface ProcessUISchemaSuccessAction {
  type: typeof PROCESS_UI_SCHEMA_SUCCESS_ACTION;
  schema: UISchemaElement;
}

export interface ProcessUISchemaFailedAction {
  type: typeof PROCESS_UI_SCHEMA_FAILED_ACTION;
  error: string;
}

export interface ResolveDataSchemaSuccessAction {
  type: typeof RESOLVE_DATA_SCHEMA_SUCCESS_ACTION;
  schema: JsonSchema;
}

export interface ResolveDataSchemaFailedAction {
  type: typeof RESOLVE_DATA_SCHEMA_FAILED_ACTION;
  error: string;
}

export interface FetchFormMetricsAction {
  type: typeof FETCH_FORM_METRICS_ACTION;
}

export interface FetchFormMetricsSuccessAction {
  type: typeof FETCH_FORM_METRICS_SUCCESS_ACTION;
  payload: FormMetrics;
}

export type FormActionTypes =
  | ClearFormDefinitions
  | FetchFormDefinitionsSuccessAction
  | FetchFormDefinitionsAction
  | ExportFormInfoAction
  | ExportFormInfoSuccessAction
  | StartStreamAction
  | StartStreamSuccessAction
  | DeleteFormDefinitionAction
  | DeleteFormDefinitionSuccessAction
  | UpdateFormDefinitionsAction
  | DeleteFormByIDAction
  | UpdateFormDefinitionsSuccessAction
  | OpenEditorForDefinitionAction
  | OpenEditorForDefinitionSuccessAction
  | OpenEditorForDefinitionFailedAction
  | SetDraftDataSchemaAction
  | SetDraftUISchemaAction
  | ProcessDataSchemaSuccessAction
  | ProcessUISchemaSuccessAction
  | ProcessDataSchemaFailedAction
  | ProcessUISchemaFailedAction
  | UpdateEditorFormDefinitionAction
  | ResolveDataSchemaSuccessAction
  | ResolveDataSchemaFailedAction
  | FetchFormMetricsAction
  | FetchFormMetricsSuccessAction
  | TagResourceAction
  | UnTagResourceAction
  | FetchResourceTagsAction
  | FetchResourceTagsSuccessAction
  | FetchTagByTagNameAction
  | FetchTagByTagNameActionSuccess
  | FetchTagByTagNameActionFailed;

export interface TagResourceAction {
  type: typeof TAG_FORM_RESOURCE_ACTION;
  tag: ResourceTag;
}

export interface FetchResourceTagsAction {
  type: typeof FETCH_FORM_RESOURCE_TAGS_ACTION;
  payload: string;
}

export interface FetchTagByTagNameAction {
  type: typeof FETCH_FORM_TAG_BY_TAG_NAME_ACTION;
  payload: string;
}
export interface FetchTagByTagNameActionFailed {
  type: typeof FETCH_FORM_TAG_BY_TAG_NAME_ACTION_FAILED;
  payload: FormResourceTagResult;
}

export interface FetchTagByTagNameActionSuccess {
  type: typeof FETCH_FORM_TAG_BY_TAG_NAME_ACTION_SUCCESS;
  payload: FormResourceTagResult;
}

export interface FetchResourceTagsSuccessAction {
  type: typeof FETCH_FORM_RESOURCE_TAGS_ACTION_SUCCESS;
  payload: FormResourceTagResponse;
}

export interface UnTagResourceAction {
  type: typeof UNTAG_FORM_RESOURCE_ACTION;
  payload: FormResourceTagResult;
}

export const clearFormDefinitions = (): ClearFormDefinitions => ({
  type: CLEAR_FORM_DEFINITIONS_ACTION,
});

export const updateFormDefinition = (definition: FormDefinition, options?: string): UpdateFormDefinitionsAction => ({
  type: UPDATE_FORM_DEFINITION_ACTION,
  definition,
  options,
});

export const updateFormDefinitionSuccess = (definition: FormDefinition): UpdateFormDefinitionsSuccessAction => ({
  type: UPDATE_FORM_DEFINITION_SUCCESS_ACTION,
  payload: definition,
});

export const deleteFormDefinition = (definition: FormDefinition): DeleteFormDefinitionAction => ({
  type: DELETE_FORM_DEFINITION_ACTION,
  definition,
});

export const deleteFormDefinitionSuccess = (definition: FormDefinition): DeleteFormDefinitionSuccessAction => ({
  type: DELETE_FORM_DEFINITION_SUCCESS_ACTION,
  payload: definition,
});

export const getFormDefinitions = (next?: string): FetchFormDefinitionsAction => ({
  type: FETCH_FORM_DEFINITIONS_ACTION,
  next,
});

export const getFormDefinitionsSuccess = (
  results: Record<string, FormDefinition>,
  next: string,
  after: string
): FetchFormDefinitionsSuccessAction => ({
  type: FETCH_FORM_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
  next,
  after,
});

export const getExportFormInfo = (
  id: string,
  resource: string,
  format: string,
  selectedColumn: string[],
  fileNamePrefix: string
): ExportFormInfoAction => ({
  type: EXPORT_FORM_INFO_ACTION,
  id,
  resource,
  format,
  selectedColumn,
  fileNamePrefix,
});

export const startSocket = (): StartStreamAction => ({
  type: START_SOCKET_STREAM_ACTION,
});

export const startSocketSuccess = (socket: Socket): StartStreamSuccessAction => ({
  type: START_SOCKET_STREAM_SUCCESS_ACTION,
  socket,
});

export const getExportFormInfoSuccess = (response: FormExportResponse): ExportFormInfoSuccessAction => ({
  type: EXPORT_FORM_INFO_SUCCESS_ACTION,
  payload: response,
});

export const deleteFormById = (id: string): DeleteFormByIDAction => ({
  type: DELETE_FORM_BY_ID_ACTION,
  id,
});

export const openEditorForDefinition = (id: string, newDefinition?: FormDefinition): OpenEditorForDefinitionAction => ({
  type: OPEN_EDITOR_FOR_DEFINITION_ACTION,
  id,
  newDefinition,
});

export const openEditorForDefinitionSuccess = (
  definition: FormDefinition,
  isNew: boolean
): OpenEditorForDefinitionSuccessAction => ({
  type: OPEN_EDITOR_FOR_DEFINITION_SUCCESS_ACTION,
  definition,
  isNew,
});

export const openEditorForDefinitionFailed = (id: string): OpenEditorForDefinitionFailedAction => ({
  type: OPEN_EDITOR_FOR_DEFINITION_FAILED_ACTION,
  id,
});

export const updateEditorFormDefinition = (
  update: Partial<Omit<FormDefinition, 'dataSchema' | 'uiSchema'>>
): UpdateEditorFormDefinitionAction => ({
  type: UPDATE_EDITOR_FORM_DEFINITION_ACTION,
  update,
});

export const setDraftDataSchema = (draft: string): SetDraftDataSchemaAction => ({
  type: SET_DRAFT_DATA_SCHEMA_ACTION,
  draft,
});

export const setDraftUISchema = (draft: string): SetDraftUISchemaAction => ({
  type: SET_DRAFT_UI_SCHEMA_ACTION,
  draft,
});

export const processedDataSchema = (schema: JsonSchema): ProcessDataSchemaSuccessAction => ({
  type: PROCESS_DATA_SCHEMA_SUCCESS_ACTION,
  schema,
});

export const processDataSchemaFailed = (error: string): ProcessDataSchemaFailedAction => ({
  type: PROCESS_DATA_SCHEMA_FAILED_ACTION,
  error,
});

export const processedUISchema = (schema: UISchemaElement): ProcessUISchemaSuccessAction => ({
  type: PROCESS_UI_SCHEMA_SUCCESS_ACTION,
  schema,
});

export const processUISchemaFailed = (error: string): ProcessUISchemaFailedAction => ({
  type: PROCESS_UI_SCHEMA_FAILED_ACTION,
  error,
});

export const resolvedDataSchema = (schema: JsonSchema): ResolveDataSchemaSuccessAction => ({
  type: RESOLVE_DATA_SCHEMA_SUCCESS_ACTION,
  schema,
});

export const resolveDataSchemaFailed = (error: string): ResolveDataSchemaFailedAction => ({
  type: RESOLVE_DATA_SCHEMA_FAILED_ACTION,
  error,
});

export const fetchFormMetrics = (): FetchFormMetricsAction => ({
  type: FETCH_FORM_METRICS_ACTION,
});

export const fetchFormMetricsSuccess = (metrics: FormMetrics): FetchFormMetricsSuccessAction => ({
  type: FETCH_FORM_METRICS_SUCCESS_ACTION,
  payload: metrics,
});

export const tagFormResource = (data: ResourceTag): TagResourceAction => ({
  type: TAG_FORM_RESOURCE_ACTION,
  tag: data,
});

export const unTagFormResource = (data: FormResourceTagResult): UnTagResourceAction => ({
  type: UNTAG_FORM_RESOURCE_ACTION,
  payload: data,
});

export const fetchFormResourceTags = (data: string): FetchResourceTagsAction => ({
  type: FETCH_FORM_RESOURCE_TAGS_ACTION,
  payload: data,
});

export const fetchFormResourceTagsSuccess = (data: FormResourceTagResponse): FetchResourceTagsSuccessAction => ({
  type: FETCH_FORM_RESOURCE_TAGS_ACTION_SUCCESS,
  payload: data,
});

export const fetchFormTagByTagName = (data: string): FetchTagByTagNameAction => ({
  type: FETCH_FORM_TAG_BY_TAG_NAME_ACTION,
  payload: data,
});

export const fetchFormTagByTagNameSuccess = (data: FormResourceTagResult): FetchTagByTagNameActionSuccess => ({
  type: FETCH_FORM_TAG_BY_TAG_NAME_ACTION_SUCCESS,
  payload: data,
});

export const fetchFormTagByTagNameFailed = (data: FormResourceTagResult): FetchTagByTagNameActionFailed => ({
  type: FETCH_FORM_TAG_BY_TAG_NAME_ACTION_FAILED,
  payload: data,
});
