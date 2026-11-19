import {
  FETCH_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION,
  FETCH_SHAREPOINT_CREDENTIAL_STATUS_SUCCESS_ACTION,
  FETCH_SHAREPOINT_FORMS_SUCCESS_ACTION,
  SET_UP_SHAREPOINT_DESTINATION_ACTION,
  SET_UP_SHAREPOINT_DESTINATION_SUCCESS_ACTION,
  SharepointActionTypes,
  SharepointConnection,
  SharepointCredentialStatus,
  SharepointDestination,
  SharepointFormChoice,
  SharepointTestResult,
  SharepointVerifyState,
  TEST_SHAREPOINT_DESTINATION_ACTION,
  TEST_SHAREPOINT_DESTINATION_SUCCESS_ACTION,
  UPDATE_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION,
  UPDATE_SHAREPOINT_DESTINATION_ACTION,
  VERIFY_SHAREPOINT_DESTINATION_ACTION,
  VERIFY_SHAREPOINT_DESTINATION_SUCCESS_ACTION,
} from './actions';

export interface SharepointState {
  connections: Record<string, SharepointConnection>;
  destinations: Record<string, SharepointDestination>;
  credentialStatus: Record<string, SharepointCredentialStatus>;
  testResults: Record<string, SharepointTestResult>;
  verifyResults: Record<string, SharepointVerifyState>;
  forms?: SharepointFormChoice[];
}

const defaultState: SharepointState = {
  connections: {},
  destinations: {},
  credentialStatus: {},
  testResults: {},
  verifyResults: {},
};

export default function sharepointReducer(
  state: SharepointState = defaultState,
  action: SharepointActionTypes,
): SharepointState {
  switch (action.type) {
    case FETCH_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION:
    case UPDATE_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION:
      return { ...state, connections: action.payload.connections, destinations: action.payload.destinations };
    case FETCH_SHAREPOINT_CREDENTIAL_STATUS_SUCCESS_ACTION:
      return { ...state, credentialStatus: { ...state.credentialStatus, [action.id]: action.payload } };
    case TEST_SHAREPOINT_DESTINATION_ACTION: {
      const testResults = { ...state.testResults };
      delete testResults[action.id];
      return { ...state, testResults };
    }
    case TEST_SHAREPOINT_DESTINATION_SUCCESS_ACTION:
      return { ...state, testResults: { ...state.testResults, [action.id]: action.payload } };
    case UPDATE_SHAREPOINT_DESTINATION_ACTION:
      return action.verifyAfterSave
        ? { ...state, verifyResults: { ...state.verifyResults, [action.payload.id]: { loading: true } } }
        : state;
    case VERIFY_SHAREPOINT_DESTINATION_ACTION:
    case SET_UP_SHAREPOINT_DESTINATION_ACTION:
      return {
        ...state,
        verifyResults: {
          ...state.verifyResults,
          [action.id]: { loading: true, report: state.verifyResults[action.id]?.report },
        },
      };
    case VERIFY_SHAREPOINT_DESTINATION_SUCCESS_ACTION:
    case SET_UP_SHAREPOINT_DESTINATION_SUCCESS_ACTION:
      return {
        ...state,
        verifyResults: { ...state.verifyResults, [action.id]: { loading: false, ...action.payload } },
      };
    case FETCH_SHAREPOINT_FORMS_SUCCESS_ACTION:
      return { ...state, forms: action.payload };
    default:
      return state;
  }
}
