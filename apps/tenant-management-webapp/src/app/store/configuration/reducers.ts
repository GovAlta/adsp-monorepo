import {
  ConfigurationExportActionTypes,
  ConfigurationDefinitionActionTypes,
  DELETE_CONFIGURATION_ACTION_SUCCESS,
  FETCH_CONFIGURATION_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  FETCH_CONFIGURATION_SUCCESS_ACTION,
  UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION,
  CLEAR_CONFIGURATION_ACTION,
} from './action';
import { ConfigurationDefinitionState, ConfigurationExportState } from './model';

const defaultState: ConfigurationDefinitionState = {
  coreConfigDefinitions: undefined,
  tenantConfigDefinitions: undefined,
  isAddedFromOverviewPage: false,
};

export default function (
  state: ConfigurationDefinitionState = defaultState,
  action: ConfigurationDefinitionActionTypes
): ConfigurationDefinitionState {
  switch (action.type) {
    case FETCH_CONFIGURATION_DEFINITIONS_ACTION:
      return {
        ...state,
        isAddedFromOverviewPage: false,
      };
    case FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION:
      return {
        ...state,
        coreConfigDefinitions: action.payload.core.latest,
        tenantConfigDefinitions: action.payload.tenant.latest,
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

export const ConfigurationExport = (
  state: ConfigurationExportState = {},
  action: ConfigurationExportActionTypes
): ConfigurationExportState => {
  switch (action.type) {
    case FETCH_CONFIGURATION_ACTION:
      return {
        ...state,
      };
    case FETCH_CONFIGURATION_SUCCESS_ACTION:
      return {
        ...state,
        [`${action.payload.namespace}:${action.payload.name}`]: {
          configuration: action.payload.latest?.configuration,
          revision: action.payload.latest?.revision,
        },
      };
    case CLEAR_CONFIGURATION_ACTION: {
      const tmp = { ...state };
      if (tmp[action.payload]) {
        delete tmp[action.payload];
      }
      return tmp;
    }
    default:
      return state;
  }
};
