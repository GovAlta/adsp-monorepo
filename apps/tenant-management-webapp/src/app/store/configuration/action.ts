import { ServiceConfigurationTypes, ConfigDefinition, ServiceSchemas, ServiceConfiguration } from './model';

export const DELETE_CONFIGURATION_ACTION = 'configuration/DELETE_CONFIGURATION_ACTION';
export const DELETE_CONFIGURATION_ACTION_SUCCESS = 'configuration/DELETE_CONFIGURATION_ACTION_SUCCESS';

export const UPDATE_CONFIGURATION_DEFINITION_ACTION = 'configuration/UPDATE_CONFIGURATION_DEFINITION_ACTION';
export const UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION =
  'configuration/UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION';

export const FETCH_CONFIGURATION_DEFINITIONS_ACTION = 'configuration/FETCH_CONFIGURATION_DEFINITIONS_ACTION';
export const FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION =
  'configuration/FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION';
export interface DeleteConfigurationDefinitionAction {
  type: typeof DELETE_CONFIGURATION_ACTION;
  definitionName: string;
}

export interface DeleteConfigurationDefinitionSuccessAction {
  type: typeof DELETE_CONFIGURATION_ACTION_SUCCESS;
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
  type: typeof UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION;
  payload: ServiceSchemas;
  isAddedFromOverviewPage: boolean;
}

export type ConfigurationDefinitionActionTypes =
  | FetchConfigurationDefinitionsAction
  | FetchConfigurationDefinitionsSuccessAction
  | UpdateConfigurationDefinitionAction
  | UpdateConfigurationDefinitionSuccessAction
  | DeleteConfigurationDefinitionAction
  | DeleteConfigurationDefinitionSuccessAction;

export const FETCH_CONFIGURATIONS_ACTION = 'configuration/FETCH_CONFIGURATIONS_ACTION';
export const FETCH_CONFIGURATIONS_SUCCESS_ACTION = 'configuration/FETCH_CONFIGURATIONS_SUCCESS_ACTION';
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
  type: DELETE_CONFIGURATION_ACTION,
  definitionName,
});

export const deleteConfigurationDefinitionSuccess = (
  definition: ServiceSchemas
): DeleteConfigurationDefinitionSuccessAction => ({
  type: DELETE_CONFIGURATION_ACTION_SUCCESS,
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
  type: UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION,
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

export const getConfigurations = (services: ServiceId[]): FetchConfigurationsAction => ({
  type: FETCH_CONFIGURATIONS_ACTION,
  services: services,
});

export const getConfigurationsSuccess = (results: ServiceConfiguration[]): FetchConfigurationSuccessAction => ({
  type: FETCH_CONFIGURATIONS_SUCCESS_ACTION,
  payload: results,
});
