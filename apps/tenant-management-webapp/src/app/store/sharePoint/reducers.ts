import {
  FETCH_SHAREPOINT_CONNECTIONS_SUCCESS_ACTION,
  UPDATE_SHAREPOINT_CONNECTION_SUCCESS_ACTION,
  SharepointConnection,
  SharepointConnectionActionTypes,
  DELETE_SHAREPOINT_CONNECTION_SUCCESS_ACTION,
} from './actions';

export interface SharepointConnectionsState {
  connections: Record<string, SharepointConnection>;
  isLoading: boolean;
}

const defaultState: SharepointConnectionsState = {
  connections: {},
  isLoading: false,
};

export default function sharepointReducer(
  state: SharepointConnectionsState = defaultState,
  action: SharepointConnectionActionTypes,
): SharepointConnectionsState {
  switch (action.type) {
    case FETCH_SHAREPOINT_CONNECTIONS_SUCCESS_ACTION:
      return {
        ...state,
        isLoading: true,
        connections: action.payload,
      };

    case UPDATE_SHAREPOINT_CONNECTION_SUCCESS_ACTION:
      return {
        ...state,
        connections: action.payload,
      };

    case DELETE_SHAREPOINT_CONNECTION_SUCCESS_ACTION:
      return {
        ...state,
        connections: action.payload,
      };

    default:
      return state;
  }
}
