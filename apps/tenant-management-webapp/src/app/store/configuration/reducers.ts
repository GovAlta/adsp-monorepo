import {
  ConfigurationExportActionTypes,
  ConfigurationDefinitionActionTypes,
  DELETE_CONFIGURATION_ACTION_SUCCESS,
  FETCH_CONFIGURATIONS_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  FETCH_CONFIGURATIONS_SUCCESS_ACTION,
  UPDATE_CONFIGURATION__DEFINITION_SUCCESS_ACTION,
} from './action';
import {
  ConfigurationDefinitionState,
  ConfigurationExportState,
  ConfigurationExportType,
  ServiceConfiguration,
} from './model';

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
    case FETCH_CONFIGURATIONS_ACTION:
      return state;
    case FETCH_CONFIGURATIONS_SUCCESS_ACTION:
      return newConfigurationExportState(action.payload);
    default:
      return state;
  }
};

const newConfigurationExportState = (configs: ServiceConfiguration[]): Record<string, ConfigurationExportType> => {
  return configs.reduce((result: Record<string, ConfigurationExportType>, c) => {
    result[`${c.namespace}:${c.name}`] = c.latest;
    return result;
  }, {});
};
