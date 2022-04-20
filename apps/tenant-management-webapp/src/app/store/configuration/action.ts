import { ConfigurationDefinitionTypes } from './model';

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

export type ConfigurationActionTypes = FetchConfigurationDefinitionsAction | FetchConfigurationDefinitionsSuccessAction;

export const getConfigurationDefinitions = (): FetchConfigurationDefinitionsAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_ACTION,
});

export const getConfigurationDefinitionsSuccess = (
  results: ConfigurationDefinitionTypes
): FetchConfigurationDefinitionsSuccessAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});
