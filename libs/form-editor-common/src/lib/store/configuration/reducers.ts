import {
  ConfigurationDefinitionActionTypes,
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  FETCH_CONFIGURATION_DEFINITIONS_SUCCESS_ACTION,
  FETCH_REGISTER_DATA_SUCCESS_ACTION,
} from './action';
import {
  ConfigurationDefinitionState,

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
