import {
  ActionTypes,
  DELETE_APPLICATION_SUCCESS_ACTION,
  FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION,
  FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION,
  FETCH_STATUS_METRICS_SUCCESS_ACTION,
  SAVE_APPLICATION_SUCCESS_ACTION,
  SET_APPLICATION_SUCCESS_STATUS_ACTION,
  TOGGLE_APPLICATION_SUCCESS_STATUS_ACTION,
  UPDATE_FORM_DATA_ACTION,
  FETCH_STATUS_CONFIGURATION_SUCCEEDED,
  UPDATE_STATUS_CONTACT_INFORMATION,
} from './actions';
import { ApplicationDescription, ApplicationStatus, ServiceStatus } from './models';

const initialState: ServiceStatus = {
  applications: [],
  editedApps: {},
  endpointHealth: {},
  currentFormData: {
    name: '',
    tenantId: '',
    enabled: false,
    description: '',
    endpoint: { url: '', status: 'offline' },
  },
  metrics: {},
  contact: {
    contactEmail: null,
  },
};

const compareIds = (a: { _id?: string }, b: { _id?: string }): number => (a._id <= b._id ? 1 : -1);
const compareApps = (a: ApplicationDescription, b: ApplicationStatus): boolean => {
  return a.name !== b.name || a.description !== b.description || a.url !== b.endpoint?.url;
};

export default function statusReducer(state: ServiceStatus = initialState, action: ActionTypes): ServiceStatus {
  switch (action.type) {
    case FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION: {
      // Every now and then the configuration-service's cache doesn't refresh
      // quickly enough, and the update we just saved comes back with the name
      // being 'unknown'.  Since the front-end knows what the names should be
      // we keep them in a redux state variable.
      const localApps = { ...state.editedApps };
      const configurationApps = action.payload
        .map((status) => {
          const local = localApps[status._id];
          if (local && !compareApps(local, status)) {
            console.log(`server app ${status.name} and local app ${local.name} do not agree`);
            status.name = local.name;
            status.description = local.description;
            status.endpoint.url = local.url;
          }
          // If the apps are identical then the configuration-service cache
          // is all caught up and we can delete the local value
          else if (local) {
            delete localApps[status._id];
          }
          return status;
        })
        .sort(compareIds);
      return {
        ...state,
        applications: configurationApps,
        editedApps: localApps,
      };
    }

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
    case SET_APPLICATION_SUCCESS_STATUS_ACTION: {
      const index = state.applications.findIndex((app) => {
        return app._id === action.payload._id;
      });
      if (index !== -1) {
        state.applications[index] = action.payload;
      }
      const id = action.payload._id;
      const editedApps = { ...state.editedApps };
      if (id) {
        editedApps[id] = {
          _id: id,
          name: action.payload.name,
          description: action.payload.description,
          url: action.payload.endpoint.url,
        };
      }
      return { ...state, editedApps: editedApps };
    }
    case TOGGLE_APPLICATION_SUCCESS_STATUS_ACTION:
      return {
        ...state,
        applications: state.applications
          .map((app) =>
            app._id !== action.payload._id
              ? { ...app }
              : { ...app, enabled: action.payload.enabled, internalStatus: action.payload.internalStatus }
          )
          .sort(compareIds),
      };

    case UPDATE_FORM_DATA_ACTION:
      return {
        ...state,
        currentFormData: action.payload,
      };
    case FETCH_STATUS_METRICS_SUCCESS_ACTION:
      return {
        ...state,
        metrics: action.metrics,
      };
    case FETCH_STATUS_CONFIGURATION_SUCCEEDED:
      return {
        ...state,
        contact: action.payload?.contact,
      };
    case UPDATE_STATUS_CONTACT_INFORMATION:
      return {
        ...state,
        contact: action.payload,
      };
    default:
      return state;
  }
}
