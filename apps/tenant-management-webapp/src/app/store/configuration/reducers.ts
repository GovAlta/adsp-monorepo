import {
  ConfigurationActionTypes,
  DELETE_CONFIGURATION_ACTION_SUCCESS,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION,
} from './action';
import { ConfigurationState } from './model';

const defaultState: ConfigurationState = {
  coreConfigDefinitions: undefined,
  tenantConfigDefinitions: undefined,
  isAddedFromOverviewPage: false,
};

export default function (
  state: ConfigurationState = defaultState,
  action: ConfigurationActionTypes
): ConfigurationState {
  switch (action.type) {
    case FETCH_CONFIGURATION_DEFINITIONS_ACTION:
      return {
        ...state,
        isAddedFromOverviewPage: false,
      };
    case FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION:
      return {
        ...state,
        coreConfigDefinitions: action.payload.core,
        tenantConfigDefinitions: action.payload.tenant,
        isAddedFromOverviewPage: false,
      };
    case UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION:
      return {
        ...state,
        tenantConfigDefinitions: action.payload,
        isAddedFromOverviewPage: action.isAddedFromOverviewPage,
      };
    case DELETE_CONFIGURATION_ACTION_SUCCESS:
      return {
        ...state,
        tenantConfigDefinitions: action.payload,
        isAddedFromOverviewPage: false,
      };
    default:
      return state;
  }
}
