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
  RESET_IMPORTS_LIST_ACTION,
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
  imports: [],
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

    case REPLACE_CONFIGURATION_ERROR_SUCCESS_ACTION: {
      const imports = JSON.parse(JSON.stringify(state.imports));

      let changeExists = false;

      for (let i = 0; i < imports.length; i++) {
        const imp = imports[i];

        if (action.payload.map((error) => error.name).includes(`${imp.namespace}:${imp.name}`)) {
          if (imp.success) {
            changeExists = true;
          }
          imp.error = action.payload.find((error) => error.name === `${imp.namespace}:${imp.name}`).error;
          imp.success = false;
        }
      }

      return {
        ...state,
        importedConfigurationError: action.payload,
        imports: changeExists ? imports : state.imports,
      };
    }
    case RESET_REPLACE_CONFIGURATION_LIST_SUCCESS_ACTION:
      return {
        ...state,
        importedConfigurationError: [],
      };
    case RESET_IMPORTS_LIST_ACTION:
      return { ...state, imports: [] };
    case SET_CONFIGURATION_REVISION_SUCCESS_ACTION: {
      const stateImports = JSON.parse(JSON.stringify(state.imports));
      action.payload.data.success = true;
      stateImports.unshift(action.payload.data);
      return {
        ...state,
        imports: stateImports,
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
