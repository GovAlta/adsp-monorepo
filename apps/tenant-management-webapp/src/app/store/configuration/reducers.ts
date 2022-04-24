import {
  ConfigurationActionTypes,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION,
} from './action';
import { ConfigurationState } from './model';

const defaultState: ConfigurationState = {
  coreConfigDefinitions: undefined,
  tenantConfigDefinitions: undefined,
  isLoading: { definitions: false, log: false },
};

export default function (
  state: ConfigurationState = defaultState,
  action: ConfigurationActionTypes
): ConfigurationState {
  switch (action.type) {
    case FETCH_CONFIGURATION_DEFINITIONS_ACTION:
      return {
        ...state,
        isLoading: {
          ...state.isLoading,
          definitions: true,
        },
      };
    case FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION:
      return {
        coreConfigDefinitions: action.payload.core,
        tenantConfigDefinitions: action.payload.tenant,
        isLoading: {
          ...state.isLoading,
          definitions: false,
        },
      };
    case UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION:
      return {
        ...state,
        tenantConfigDefinitions: action.payload,
        isLoading: {
          ...state.isLoading,
          definitions: false,
        },
      };
    default:
      return state;
  }
}
