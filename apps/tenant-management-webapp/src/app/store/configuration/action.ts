import { ConfigurationDefinitionTypes } from './model';

export const UPDATE_CONFIGURATION_DEFINITION_ACTION = 'configuration/UPDATE_CONFIGURATION_DEFINITION_ACTION';
export const UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION =
  'configuration/UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION';

export const FETCH_CONFIGURATION_DEFINITIONS_ACTION = 'configuration/FETCH_CONFIGURATION_DEFINITIONS_ACTION';
export const FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION =
  'configuration/FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION';

export interface FetchConfigurationDefinitionsAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_ACTION;
}

export interface FetchConfigurationDefinitionsSuccessAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION;
  payload: ConfigurationDefinitionTypes;
}

export interface UpdateConfigurationDefinitionAction {
  type: typeof UPDATE_CONFIGURATION_DEFINITION_ACTION;
  definition: any; //cleanup
}

export interface UpdateConfigurationDefinitionSuccessAction {
  type: typeof UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION;
  payload: any; //cleanup
}

export type ConfigurationActionTypes =
  | FetchConfigurationDefinitionsAction
  | FetchConfigurationDefinitionsSuccessAction
  | UpdateConfigurationDefinitionAction
  | UpdateConfigurationDefinitionSuccessAction;

export const updateConfigurationDefinition = (definition: any): UpdateConfigurationDefinitionAction => ({
  type: UPDATE_CONFIGURATION_DEFINITION_ACTION,
  definition,
});
export const updateConfigurationDefinitionSuccess = (definition: any): UpdateConfigurationDefinitionSuccessAction => ({
  type: UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION,
  payload: definition,
});
export const getConfigurationDefinitions = (): FetchConfigurationDefinitionsAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_ACTION,
});

export const getConfigurationDefinitionsSuccess = (
  results: ConfigurationDefinitionTypes
): FetchConfigurationDefinitionsSuccessAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});
