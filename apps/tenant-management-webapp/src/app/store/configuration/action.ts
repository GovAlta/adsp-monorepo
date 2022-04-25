import { ConfigDefinition, ConfigurationDefinitionTypes } from './model';

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
  payload: Record<string, unknown>;
}
export interface FetchConfigurationDefinitionsAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_ACTION;
}

export interface FetchConfigurationDefinitionsSuccessAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION;
  payload: ConfigurationDefinitionTypes;
}

export interface UpdateConfigurationDefinitionAction {
  type: typeof UPDATE_CONFIGURATION_DEFINITION_ACTION;
  definition: ConfigDefinition;
  isAddedFromOverviewPage: boolean;
}

export interface UpdateConfigurationDefinitionSuccessAction {
  type: typeof UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION;
  payload: Record<string, unknown>;
  isAddedFromOverviewPage: boolean;
}

export type ConfigurationActionTypes =
  | FetchConfigurationDefinitionsAction
  | FetchConfigurationDefinitionsSuccessAction
  | UpdateConfigurationDefinitionAction
  | UpdateConfigurationDefinitionSuccessAction
  | DeleteConfigurationDefinitionAction
  | DeleteConfigurationDefinitionSuccessAction;

export const deleteConfigurationDefinition = (definitionName: string): DeleteConfigurationDefinitionAction => ({
  type: DELETE_CONFIGURATION_ACTION,
  definitionName,
});

export const deleteConfigurationDefinitionSuccess = (
  definition: Record<string, unknown>
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
  definition: Record<string, unknown>,
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
  results: ConfigurationDefinitionTypes
): FetchConfigurationDefinitionsSuccessAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});
