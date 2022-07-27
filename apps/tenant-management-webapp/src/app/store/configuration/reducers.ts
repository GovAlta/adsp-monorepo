import {
  ConfigurationExportActionTypes,
  ConfigurationDefinitionActionTypes,
  DELETE_CONFIGURATION_DEFINITION_ACTION_SUCCESS,
  FETCH_CONFIGURATIONS_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  FETCH_CONFIGURATIONS_SUCCESS_ACTION,
  UPDATE_CONFIGURATION_DEFINITION_SUCCESS_ACTION,
  REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION,
  RESET_REPLACE_CONFIGURATION_LIST_SUCCESS_ACTION,
  SET_CONFIGURATION_REVISION_SUCCESS_ACTION,
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
  lastImport: { namespace: null, name: null, latest: null },
  importedConfigurationError: [],
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
    case UPDATE_CONFIGURATION_DEFINITION_SUCCESS_ACTION:
      return {
        ...state,
        tenantConfigDefinitions: action.payload,
        isAddedFromOverviewPage: action.isAddedFromOverviewPage,
      };
    case DELETE_CONFIGURATION_DEFINITION_ACTION_SUCCESS:
      return {
        ...state,
        tenantConfigDefinitions: action.payload,
        isAddedFromOverviewPage: false,
      };
    case REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION:
      return {
        ...state,
        importedConfigurationError: action.payload,
      };
    case RESET_REPLACE_CONFIGURATION_LIST_SUCCESS_ACTION:
      return {
        ...state,
        importedConfigurationError: [],
      };
    case SET_CONFIGURATION_REVISION_SUCCESS_ACTION: {
      console.log(JSON.stringify(action.payload) + '<action.payload');
      return {
        ...state,
        lastImport: action.payload,
      };
    }
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
    if (c.description) {
      if (!c.latest) {
        result[`${c.namespace}:${c.name}`] = {
          configuration: null,
          revision: null,
          description: c.description,
        };
      } else {
        result[`${c.namespace}:${c.name}`] = c.latest;
        result[`${c.namespace}:${c.name}`].description = c.description;
      }
    } else {
      result[`${c.namespace}:${c.name}`] = c.latest;
    }

    return result;
  }, {});
};
