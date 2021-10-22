import {
  ActionTypes,
  DELETE_APPLICATION_SUCCESS_ACTION,
  FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION,
  FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION,
  SAVE_APPLICATION_SUCCESS_ACTION,
  SET_APPLICATION_SUCCESS_STATUS_ACTION,
  TOGGLE_APPLICATION_SUCCESS_STATUS_ACTION,
} from './actions';
import { ServiceStatus } from './models';

const initialState: ServiceStatus = {
  applications: [],
  endpointHealth: {},
};

const compareIds = (a: { _id?: string }, b: { _id?: string }): number => (a._id <= b._id ? 1 : -1);

export default function statusReducer(state: ServiceStatus = initialState, action: ActionTypes): ServiceStatus {
  switch (action.type) {
    case FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION:
      return {
        ...state,
        applications: action.payload.sort(compareIds),
      };
    case FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION:
      return {
        ...state,
        endpointHealth: {
          ...state.endpointHealth,
          [action.payload.applicationId]: { url: action.payload.url, entries: action.payload.entries || [] },
        },
      };
    case DELETE_APPLICATION_SUCCESS_ACTION:
      return {
        ...state,
        applications: [...state.applications.filter((app) => app._id !== action.payload)].sort(compareIds),
      };
    case SAVE_APPLICATION_SUCCESS_ACTION:
    case SET_APPLICATION_SUCCESS_STATUS_ACTION:
    case TOGGLE_APPLICATION_SUCCESS_STATUS_ACTION:
      return {
        ...state,
        applications: [...state.applications.filter((app) => app._id !== action.payload._id), action.payload].sort(
          compareIds
        ),
      };

    default:
      return state;
  }
}
