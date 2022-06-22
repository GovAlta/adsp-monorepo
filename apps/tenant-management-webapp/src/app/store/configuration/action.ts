import {
  ServiceConfigurationTypes,
  ConfigDefinition,
  ServiceSchemas,
  ServiceConfiguration,
  ConfigurationRevisionRequest,
  ReplaceConfiguration,
} from './model';

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

export const SET_CONFIGURATION_REVISION_ACTION = 'configuration/SET_CONFIGURATION_REVISION_ACTION';
export const SET_CONFIGURATION_REVISION_SUCCESS_ACTION = 'configuration/SET_CONFIGURATION_REVISION_SUCCESS_ACTION';

export const REPLACE_CONFIGURATION_DATA_ACTION = 'configuration/REPLACE_CONFIGURATION_DATA_ACTION';
export const REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION = 'configuration/REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION';

export const REPLACE_CONFIGURATION_ERROR_ACTION = 'configuration/REPLACE_CONFIGURATION_ERROR_ACTION';
export const REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION = 'configuration/REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION';
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

export interface UpdateConfigurationDefinitionAction {
  type: typeof UPDATE_CONFIGURATION_DEFINITION_ACTION;
  definition: ConfigDefinition;
  isAddedFromOverviewPage: boolean;
}

export interface UpdateConfigurationDefinitionSuccessAction {
  type: typeof UPDATE_CONFIGURATION_DEFINITION_SUCCESS_ACTION;
  payload: ServiceSchemas;
  isAddedFromOverviewPage: boolean;
}

export interface SetConfigurationRevisionAction {
  type: typeof SET_CONFIGURATION_REVISION_ACTION;
  request: ConfigurationRevisionRequest;
}

export interface SetConfigurationRevisionSuccessAction {
  type: typeof SET_CONFIGURATION_REVISION_SUCCESS_ACTION;
  payload: ServiceConfiguration;
}

export interface ReplaceConfigurationDataAction {
  type: typeof REPLACE_CONFIGURATION_DATA_ACTION;
  configuration: ReplaceConfiguration;
}

export interface ReplaceConfigurationDataSuccessAction {
  type: typeof REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION;
}

export interface GetReplaceConfigurationErrorAction {
  type: typeof REPLACE_CONFIGURATION_ERROR_ACTION;
}
export interface GetReplaceConfigurationErrorSuccessAction {
  type: typeof REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION;
  payload: string[];
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
  | ReplaceConfigurationDataAction
  | ReplaceConfigurationDataSuccessAction
  | GetReplaceConfigurationErrorAction
  | GetReplaceConfigurationErrorSuccessAction;

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
  isAddedFromOverviewPage: boolean
): UpdateConfigurationDefinitionAction => ({
  type: UPDATE_CONFIGURATION_DEFINITION_ACTION,
  definition,
  isAddedFromOverviewPage,
});
export const updateConfigurationDefinitionSuccess = (
  definition: ServiceSchemas,
  isAddedFromOverviewPage: boolean
): UpdateConfigurationDefinitionSuccessAction => ({
  type: UPDATE_CONFIGURATION_DEFINITION_SUCCESS_ACTION,
  payload: definition,
  isAddedFromOverviewPage,
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

export const setConfigurationRevisionAction = (
  request: ConfigurationRevisionRequest
): SetConfigurationRevisionAction => ({
  type: SET_CONFIGURATION_REVISION_ACTION,
  request,
});
export const setConfigurationRevisionSuccessAction = (
  payload: ServiceConfiguration
): SetConfigurationRevisionSuccessAction => ({
  type: SET_CONFIGURATION_REVISION_SUCCESS_ACTION,
  payload,
});

export const replaceConfigurationDataAction = (
  configuration: ReplaceConfiguration
): ReplaceConfigurationDataAction => ({
  type: REPLACE_CONFIGURATION_DATA_ACTION,
  configuration,
});

export const replaceConfigurationDataSuccessAction = (): ReplaceConfigurationDataSuccessAction => ({
  type: REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION,
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
  replacedConfiguration: string[]
): GetReplaceConfigurationErrorSuccessAction => ({
  type: REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION,
  payload: replacedConfiguration,
});
