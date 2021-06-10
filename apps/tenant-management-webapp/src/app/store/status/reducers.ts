import { ActionTypes } from './actions';
import { ServiceStatus } from './models';

const initialState: ServiceStatus = {
  applications: [],
};

const compareIds = (a: { id?: string }, b: { id?: string }): number => (a.id <= b.id ? 1 : -1);

export default function statusReducer(state: ServiceStatus = initialState, action: ActionTypes): ServiceStatus {
  switch (action.type) {
    case 'status/FETCH_SERVICE_STATUS_APPS_SUCCESS':
      return {
        ...state,
        applications: action.payload.sort(compareIds),
      };
    case 'status/SAVE_APPLICATION_SUCCESS': {
      const applications = [...state.applications.filter((app) => app.id !== action.payload.id), action.payload];
      return {
        ...state,
        applications: applications.sort(compareIds),
      };
    }
    case 'status/DELETE_APPLICATION_SUCCESS':
      return {
        ...state,
        applications: [...state.applications.filter((app) => app.id !== action.payload)].sort(compareIds),
      };
    case 'status/SET_APPLICATION_STATUS_SUCCESS':
      return {
        ...state,
        applications: [...state.applications.filter((app) => app.id !== action.payload.id), action.payload].sort(
          compareIds
        ),
      };

    default:
      return state;
  }
}
