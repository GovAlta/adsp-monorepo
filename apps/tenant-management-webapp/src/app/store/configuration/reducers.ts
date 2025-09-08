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
  SET_CONFIGURATION_REVISION_ACTIVE_SUCCESS_ACTION,
  RESET_IMPORTS_LIST_ACTION,
  FETCH_CONFIGURATION_REVISIONS_SUCCESS_ACTION,
  FETCH_CONFIGURATION_ACTIVE_REVISION_SUCCESS_ACTION,
  REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION,
  UPDATE_LATEST_REVISION_SUCCESS_ACTION,
  FETCH_REGISTER_DATA_SUCCESS_ACTION,
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
  configurationRevisions: {},
  serviceList: [],
  registers: [],
  nonAnonymous: [],
  openEditor: null,
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
        coreConfigDefinitions: action.payload.core?.latest,
        tenantConfigDefinitions: action.payload.tenant?.latest,
        isAddedFromOverviewPage: false,
        serviceList: [
          ...Object.keys(action.payload.core?.latest?.configuration || {}),
          ...Object.keys(action.payload.tenant?.latest?.configuration || {}),
        ].sort((a, b) => (a < b ? -1 : 1)),
      };
    case UPDATE_CONFIGURATION_DEFINITION_SUCCESS_ACTION:
      return {
        ...state,
        tenantConfigDefinitions: action.payload,
        isAddedFromOverviewPage: action.isAddedFromOverviewPage,
        serviceList: [
          ...Object.keys(state.coreConfigDefinitions.configuration || {}),
          ...Object.keys(action.payload.configuration || {}),
        ].sort((a, b) => (a < b ? -1 : 1)),
        openEditor: action.currentId,
      };
    case DELETE_CONFIGURATION_DEFINITION_ACTION_SUCCESS:
      return {
        ...state,
        tenantConfigDefinitions: action.payload,
        isAddedFromOverviewPage: false,
        serviceList: [
          ...Object.keys(state.coreConfigDefinitions.configuration || {}),
          ...Object.keys(action.payload.configuration || {}),
        ].sort((a, b) => (a < b ? -1 : 1)),
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
      if (state.configurationRevisions[action.service]?.revisions?.result) {
        state.configurationRevisions[action.service]?.revisions?.result?.unshift(action.payload.data?.latest);
        const latest = state.configurationRevisions[action.service]?.revisions?.result[0]?.revision;
        state.configurationRevisions[action.service].revisions.latest = latest;
      }

      return {
        ...state,
      };
    }

    case SET_CONFIGURATION_REVISION_ACTIVE_SUCCESS_ACTION: {
      state.configurationRevisions[action.service].revisions.active = action.payload.data?.active;
      return {
        ...state,
      };
    }
    case REPLACE_CONFIGURATION_DATA_SUCCESS_ACTION: {
      const stateImports = JSON.parse(JSON.stringify(state.imports));
      action.payload.data.success = true;
      stateImports.unshift(action.payload.data);
      return {
        ...state,
        imports: stateImports,
      };
    }
    case FETCH_CONFIGURATION_REVISIONS_SUCCESS_ACTION: {
      if (state.configurationRevisions[action.service]) {
        if (action.after) {
          const result = state.configurationRevisions[action.service].revisions.result;
          const noDuplicate = [];
          const cacheLength = result.length;
          for (let i = 0; i < action.payload.length; i++) {
            if (result[cacheLength - 1 - i].revision !== action.payload[i].revision) {
              noDuplicate.push(action.payload[i]);
            }
          }
          state.configurationRevisions[action.service].revisions.result = [
            ...state.configurationRevisions[action.service].revisions.result,
            ...noDuplicate,
          ];
        } else {
          state.configurationRevisions[action.service].revisions.result = action.payload;
        }

        state.configurationRevisions[action.service].revisions.next = action.next;
      } else {
        state.configurationRevisions[action.service] = {};
        state.configurationRevisions[action.service]['revisions'] = {};
        state.configurationRevisions[action.service]['revisions']['result'] = action.payload;
        state.configurationRevisions[action.service]['revisions']['next'] = action.next;
        const latest = state.configurationRevisions[action.service]['revisions']['result'][0].revision;
        state.configurationRevisions[action.service]['revisions']['latest'] = latest;
        state.configurationRevisions[action.service]['revisions']['isCore'] = Object.keys(
          state.coreConfigDefinitions?.configuration
        ).some((key) => key === action.service);
      }
      return {
        ...state,
      };
    }
    case FETCH_CONFIGURATION_ACTIVE_REVISION_SUCCESS_ACTION: {
      if (state.configurationRevisions[action.service] && action.payload) {
        state.configurationRevisions[action.service]['revisions']['active'] = action.payload.revision;
      }
      return {
        ...state,
      };
    }
    case UPDATE_LATEST_REVISION_SUCCESS_ACTION: {
      const configuration = action.payload;
      const service = `${configuration.namespace}:${configuration.name}`;

      if (state.configurationRevisions[service].revisions.result.length > 0) {
        state.configurationRevisions[service].revisions.result[0].configuration = configuration.configuration;
      } else {
        const revision = {
          revision: 0,
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          configuration: configuration.configuration,
        };
        state.configurationRevisions[service].revisions.result.push(revision);
      }
      return {
        ...state,
      };
    }

    case FETCH_REGISTER_DATA_SUCCESS_ACTION: {
      state.registers = action.payload;
      state.nonAnonymous = action.anonymousRead;
      state.dataList = action.dataList;

      return {
        ...state,
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
