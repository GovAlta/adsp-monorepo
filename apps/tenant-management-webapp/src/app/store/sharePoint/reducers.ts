import {
  FETCH_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION,
  FETCH_SHAREPOINT_CREDENTIAL_STATUS_SUCCESS_ACTION,
  SharepointActionTypes,
  SharepointConnection,
  SharepointCredentialStatus,
  SharepointDestination,
  SharepointTestResult,
  TEST_SHAREPOINT_DESTINATION_ACTION,
  TEST_SHAREPOINT_DESTINATION_SUCCESS_ACTION,
  UPDATE_SHAREPOINT_CONFIGURATION_SUCCESS_ACTION,
} from './actions';

export interface SharepointState {
  connections: Record<string, SharepointConnection>;
  destinations: Record<string, SharepointDestination>;
  credentialStatus: Record<string, SharepointCredentialStatus>;
  testResults: Record<string, SharepointTestResult>;
}

const defaultState: SharepointState = {
  connections: {},
  destinations: {},
  credentialStatus: {},
  testResults: {},
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
    default:
      return state;
  }
}
