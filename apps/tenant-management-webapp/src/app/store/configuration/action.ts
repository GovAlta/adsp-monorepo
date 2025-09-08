import {
  ServiceConfigurationTypes,
  ConfigDefinition,
  ServiceSchemas,
  ServiceConfiguration,
  ReplaceConfiguration,
  Revision,
} from './model';
import { RegisterData } from '@abgov/jsonforms-components';

export const DELETE_CONFIGURATION_DEFINITION_ACTION = 'configuration/DELETE_CONFIGURATION_DEFINITION_ACTION';
export const DELETE_CONFIGURATION_DEFINITION_ACTION_SUCCESS =
  'configuration/DELETE_CONFIGURATION_DEFINITION_ACTION_SUCCESS';

export const UPDATE_CONFIGURATION_DEFINITION_ACTION = 'configuration/UPDATE_CONFIGURATION_DEFINITION_ACTION';
export const UPDATE_CONFIGURATION_DEFINITION_SUCCESS_ACTION =
  'configuration/UPDATE_CONFIGURATION_DEFINITION_SUCCESS_ACTION';

export const FETCH_CONFIGURATION_DEFINITIONS_ACTION = 'configuration/FETCH_CONFIGURATION_DEFINITIONS_ACTION';
export const FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION =
  'configuration/FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION';

export const FETCH_CONFIGURATIONS_ACTION = 'configuration/FETCH_CONFIGURATIONS_ACTION';
export const FETCH_CONFIGURATIONS_SUCCESS_ACTION = 'configuration/FETCH_CONFIGURATIONS_SUCCESS_ACTION';

export const FETCH_CONFIGURATION_REVISIONS_ACTION = 'configuration/FETCH_CONFIGURATION_REVISIONS_ACTION';
export const FETCH_CONFIGURATION_REVISIONS_SUCCESS_ACTION =
  'configuration/FETCH_CONFIGURATION_REVISIONS_SUCCESS_ACTION';

export const FETCH_CONFIGURATION_ACTIVE_REVISION_ACTION = 'configuration/FETCH_CONFIGURATION_ACTIVE_REVISION_ACTION';
export const FETCH_CONFIGURATION_ACTIVE_REVISION_SUCCESS_ACTION =
  'configuration/FETCH_CONFIGURATION_ACTIVE_REVISION_SUCCESS_ACTION';

export const SET_CONFIGURATION_REVISION_ACTION = 'configuration/SET_CONFIGURATION_REVISION_ACTION';
export const SET_CONFIGURATION_REVISION_SUCCESS_ACTION = 'configuration/SET_CONFIGURATION_REVISION_SUCCESS_ACTION';

export const SET_CONFIGURATION_REVISION_ACTIVE_ACTION = 'configuration/SET_CONFIGURATION_REVISION_ACTIVE_ACTION';
export const SET_CONFIGURATION_REVISION_ACTIVE_SUCCESS_ACTION =
  'configuration/SET_CONFIGURATION_REVISION_ACTIVE_SUCCESS_ACTION';

export const REPLACE_CONFIGURATION_DATA_ACTION = 'configuration/REPLACE_CONFIGURATION_DATA_ACTION';
export const REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION = 'configuration/REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION';

export const REPLACE_CONFIGURATION_ERROR_ACTION = 'configuration/REPLACE_CONFIGURATION_ERROR_ACTION';
export const REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION = 'configuration/REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION';

export const RESET_REPLACE_CONFIGURATION_LIST_ACTION = 'configuration/RESET_REPLACE_CONFIGURATION_LIST_ACTION';
export const RESET_IMPORTS_LIST_ACTION = 'configuration/RESET_IMPORTS_LIST_ACTION';

export const RESET_REPLACE_CONFIGURATION_LIST_SUCCESS_ACTION =
  'configuration/RESET_REPLACE_CONFIGURATION_LIST_SUCCESS_ACTION';

export const FETCH_REGISTER_DATA_ACTION = 'configuration/FETCH_REGISTER_DATA';
export const FETCH_REGISTER_DATA_SUCCESS_ACTION = 'configuration/FETCH_REGISTER_DATA_SUCCESS_ACTION';

export const UPDATE_LATEST_REVISION_SUCCESS_ACTION = 'configuration/UPDATE_LATEST_REVISION_SUCCESS_ACTION';
export interface DeleteConfigurationDefinitionAction {
  type: typeof DELETE_CONFIGURATION_DEFINITION_ACTION;
  definitionName: string;
}

export interface DeleteConfigurationDefinitionSuccessAction {
  type: typeof DELETE_CONFIGURATION_DEFINITION_ACTION_SUCCESS;
  payload: ServiceSchemas;
}
export interface FetchConfigurationDefinitionsAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_ACTION;
}

export interface FetchConfigurationDefinitionsSuccessAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION;
  payload: ServiceConfigurationTypes;
}
export interface FetchConfigurationRevisionsAction {
  type: typeof FETCH_CONFIGURATION_REVISIONS_ACTION;
  service: string;
  after?: string;
}

export interface FetchConfigurationRevisionsSuccessAction {
  type: typeof FETCH_CONFIGURATION_REVISIONS_SUCCESS_ACTION;
  payload: Revision[];
  service: string;
  after: string;
  next: string;
}

export interface FetchConfigurationActionRevisionAction {
  type: typeof FETCH_CONFIGURATION_ACTIVE_REVISION_ACTION;
  service: string;
}

export interface FetchConfigurationActiveRevisionSuccessAction {
  type: typeof FETCH_CONFIGURATION_ACTIVE_REVISION_SUCCESS_ACTION;
  payload: Revision;
  service: string;
}
export interface UpdateConfigurationDefinitionAction {
  type: typeof UPDATE_CONFIGURATION_DEFINITION_ACTION;
  definition: ConfigDefinition;
  isAddedFromOverviewPage: boolean;
  openEditor?: boolean;
}

export interface UpdateConfigurationDefinitionSuccessAction {
  type: typeof UPDATE_CONFIGURATION_DEFINITION_SUCCESS_ACTION;
  payload: ServiceSchemas;
  isAddedFromOverviewPage: boolean;
  currentId: string;
}

export interface SetConfigurationRevisionAction {
  type: typeof SET_CONFIGURATION_REVISION_ACTION;
  service: string;
}

export interface SetConfigurationRevisionSuccessAction {
  type: typeof SET_CONFIGURATION_REVISION_SUCCESS_ACTION;
  payload: { data: ServiceConfiguration };
  service: string;
}

export interface SetConfigurationRevisionActiveAction {
  type: typeof SET_CONFIGURATION_REVISION_ACTIVE_ACTION;
  service: string;
  setActiveRevision: number;
}

export interface SetConfigurationRevisionActiveSuccessAction {
  type: typeof SET_CONFIGURATION_REVISION_ACTIVE_SUCCESS_ACTION;
  payload: { data: ServiceConfiguration };
  service: string;
}

export interface ReplaceConfigurationDataAction {
  type: typeof REPLACE_CONFIGURATION_DATA_ACTION;
  configuration: ReplaceConfiguration;
  isImportConfiguration: boolean;
}

export interface ReplaceConfigurationDataSuccessAction {
  type: typeof REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION;
  payload: { data: ServiceConfiguration };
}
export interface UpdateLatestRevisionSuccessAction {
  type: typeof UPDATE_LATEST_REVISION_SUCCESS_ACTION;
  payload: ReplaceConfiguration;
}
export interface GetReplaceConfigurationErrorAction {
  type: typeof REPLACE_CONFIGURATION_ERROR_ACTION;
}
export interface GetReplaceConfigurationErrorSuccessAction {
  type: typeof REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION;
  payload: { name: string; error: string }[];
}

export interface ResetReplaceConfigurationListAction {
  type: typeof RESET_REPLACE_CONFIGURATION_LIST_ACTION;
}

export interface ResetImportsListAction {
  type: typeof RESET_IMPORTS_LIST_ACTION;
}

export interface ResetReplaceConfigurationListSuccessAction {
  type: typeof RESET_REPLACE_CONFIGURATION_LIST_SUCCESS_ACTION;
}

export interface FetchRegisterDataAction {
  type: typeof FETCH_REGISTER_DATA_ACTION;
}

export interface FetchRegisterDataSuccessAction {
  type: typeof FETCH_REGISTER_DATA_SUCCESS_ACTION;
  payload: RegisterData;
  dataList: string[];
  anonymousRead: string[];
}

export type ConfigurationDefinitionActionTypes =
  | FetchConfigurationDefinitionsAction
  | FetchConfigurationDefinitionsSuccessAction
  | UpdateConfigurationDefinitionAction
  | UpdateConfigurationDefinitionSuccessAction
  | DeleteConfigurationDefinitionAction
  | DeleteConfigurationDefinitionSuccessAction
  | SetConfigurationRevisionAction
  | SetConfigurationRevisionSuccessAction
  | SetConfigurationRevisionActiveAction
  | SetConfigurationRevisionActiveSuccessAction
  | ReplaceConfigurationDataAction
  | ReplaceConfigurationDataSuccessAction
  | UpdateLatestRevisionSuccessAction
  | GetReplaceConfigurationErrorAction
  | GetReplaceConfigurationErrorSuccessAction
  | ResetReplaceConfigurationListAction
  | ResetReplaceConfigurationListSuccessAction
  | ResetImportsListAction
  | FetchConfigurationRevisionsAction
  | FetchConfigurationRevisionsSuccessAction
  | FetchConfigurationActionRevisionAction
  | FetchRegisterDataAction
  | FetchRegisterDataSuccessAction
  | FetchConfigurationActiveRevisionSuccessAction;

export type ServiceId = { namespace: string; service: string };
export interface FetchConfigurationsAction {
  type: typeof FETCH_CONFIGURATIONS_ACTION;
  services: ServiceId[];
}

export interface FetchConfigurationSuccessAction {
  type: typeof FETCH_CONFIGURATIONS_SUCCESS_ACTION;
  payload: ServiceConfiguration[];
}

export type ConfigurationExportActionTypes = FetchConfigurationsAction | FetchConfigurationSuccessAction;

export const deleteConfigurationDefinition = (definitionName: string): DeleteConfigurationDefinitionAction => ({
  type: DELETE_CONFIGURATION_DEFINITION_ACTION,
  definitionName,
});

export const deleteConfigurationDefinitionSuccess = (
  definition: ServiceSchemas
): DeleteConfigurationDefinitionSuccessAction => ({
  type: DELETE_CONFIGURATION_DEFINITION_ACTION_SUCCESS,
  payload: definition,
});

export const updateConfigurationDefinition = (
  definition: ConfigDefinition,
  isAddedFromOverviewPage: boolean,
  openEditor?: boolean
): UpdateConfigurationDefinitionAction => ({
  type: UPDATE_CONFIGURATION_DEFINITION_ACTION,
  definition,
  isAddedFromOverviewPage,
  openEditor,
});
export const updateConfigurationDefinitionSuccess = (
  definition: ServiceSchemas,
  isAddedFromOverviewPage: boolean,
  currentId: string
): UpdateConfigurationDefinitionSuccessAction => ({
  type: UPDATE_CONFIGURATION_DEFINITION_SUCCESS_ACTION,
  payload: definition,
  isAddedFromOverviewPage,
  currentId,
});
export const getConfigurationDefinitions = (): FetchConfigurationDefinitionsAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_ACTION,
});

export const getConfigurationDefinitionsSuccess = (
  results: ServiceConfigurationTypes
): FetchConfigurationDefinitionsSuccessAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});
export const getConfigurationRevisions = (service: string, after?: string): FetchConfigurationRevisionsAction => ({
  type: FETCH_CONFIGURATION_REVISIONS_ACTION,
  service,
  after,
});

export const getConfigurationRevisionsSuccess = (
  results: Revision[],
  service: string,
  after?: string,
  next?: string
): FetchConfigurationRevisionsSuccessAction => ({
  type: FETCH_CONFIGURATION_REVISIONS_SUCCESS_ACTION,
  payload: results,
  service,
  after,
  next,
});
export const getConfigurationActive = (service: string): FetchConfigurationActionRevisionAction => ({
  type: FETCH_CONFIGURATION_ACTIVE_REVISION_ACTION,
  service,
});

export const getConfigurationActiveSuccess = (
  payload: Revision,
  service: string
): FetchConfigurationActiveRevisionSuccessAction => ({
  type: FETCH_CONFIGURATION_ACTIVE_REVISION_SUCCESS_ACTION,
  payload: payload,
  service: service,
});
export const setConfigurationRevision = (service: string): SetConfigurationRevisionAction => ({
  type: SET_CONFIGURATION_REVISION_ACTION,
  service: service,
});
export const setConfigurationRevisionSuccessAction = (
  service: string,
  payload: {
    data: ServiceConfiguration;
  }
): SetConfigurationRevisionSuccessAction => ({
  type: SET_CONFIGURATION_REVISION_SUCCESS_ACTION,
  service: service,
  payload,
});

export const setConfigurationRevisionActive = (
  service: string,
  setActiveRevision: number
): SetConfigurationRevisionActiveAction => ({
  type: SET_CONFIGURATION_REVISION_ACTIVE_ACTION,
  service: service,
  setActiveRevision: setActiveRevision,
});
export const setConfigurationRevisionActiveSuccessAction = (
  service: string,
  payload: {
    data: ServiceConfiguration;
  }
): SetConfigurationRevisionActiveSuccessAction => ({
  type: SET_CONFIGURATION_REVISION_ACTIVE_SUCCESS_ACTION,
  service: service,
  payload,
});

export const replaceConfigurationDataAction = (
  configuration: ReplaceConfiguration,
  isImportConfiguration
): ReplaceConfigurationDataAction => ({
  type: REPLACE_CONFIGURATION_DATA_ACTION,
  configuration,
  isImportConfiguration,
});
export const resetReplaceConfigurationListAction = (): ResetReplaceConfigurationListAction => ({
  type: RESET_REPLACE_CONFIGURATION_LIST_ACTION,
});

export const resetImportsListAction = (): ResetImportsListAction => ({
  type: RESET_IMPORTS_LIST_ACTION,
});
export const resetReplaceConfigurationListSuccessAction = (): ResetReplaceConfigurationListSuccessAction => ({
  type: RESET_REPLACE_CONFIGURATION_LIST_SUCCESS_ACTION,
});

export const replaceConfigurationDataSuccessAction = (payload: {
  data: ServiceConfiguration;
}): ReplaceConfigurationDataSuccessAction => ({
  type: REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION,
  payload,
});

export const updateLatestRevisionSuccessAction = (
  payload: ReplaceConfiguration
): UpdateLatestRevisionSuccessAction => ({
  type: UPDATE_LATEST_REVISION_SUCCESS_ACTION,
  payload,
});

export const getConfigurations = (services: ServiceId[]): FetchConfigurationsAction => ({
  type: FETCH_CONFIGURATIONS_ACTION,
  services: services,
});

export const getConfigurationsSuccess = (results: ServiceConfiguration[]): FetchConfigurationSuccessAction => ({
  type: FETCH_CONFIGURATIONS_SUCCESS_ACTION,
  payload: results,
});
export const getReplaceConfigurationErrorAction = (): GetReplaceConfigurationErrorAction => ({
  type: REPLACE_CONFIGURATION_ERROR_ACTION,
});

export const getReplaceConfigurationErrorSuccessAction = (
  replacedConfiguration: { name: string; error: string }[]
): GetReplaceConfigurationErrorSuccessAction => ({
  type: REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION,
  payload: replacedConfiguration,
});

export const getRegisterDataSuccessAction = (
  registerData: RegisterData,
  dataList: string[],
  anonymousRead: string[]
): FetchRegisterDataSuccessAction => ({
  type: FETCH_REGISTER_DATA_SUCCESS_ACTION,
  payload: registerData,
  dataList: dataList,
  anonymousRead: anonymousRead,
});

export const getRegisterDataAction = (): FetchRegisterDataAction => ({
  type: FETCH_REGISTER_DATA_ACTION,
});
