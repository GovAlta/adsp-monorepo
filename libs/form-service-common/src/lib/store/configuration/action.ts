import {
  ServiceConfigurationTypes,
} from './model';
import { RegisterData } from '@abgov/jsonforms-components';

export const FETCH_CONFIGURATION_DEFINITIONS_ACTION = 'configuration/FETCH_CONFIGURATION_DEFINITIONS_ACTION';
export const FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION =
  'configuration/FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION';

export const FETCH_REGISTER_DATA_ACTION = 'configuration/FETCH_REGISTER_DATA';
export const FETCH_REGISTER_DATA_SUCCESS_ACTION = 'configuration/FETCH_REGISTER_DATA_SUCCESS_ACTION';

export interface FetchConfigurationDefinitionsAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_ACTION;
}

export interface FetchConfigurationDefinitionsSuccessAction {
  type: typeof FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION;
  payload: ServiceConfigurationTypes;
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
  | FetchRegisterDataAction
  | FetchRegisterDataSuccessAction;

export type ServiceId = { namespace: string; service: string };

export const getConfigurationDefinitions = (): FetchConfigurationDefinitionsAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_ACTION,
});

export const getConfigurationDefinitionsSuccess = (
  results: ServiceConfigurationTypes
): FetchConfigurationDefinitionsSuccessAction => ({
  type: FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
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
