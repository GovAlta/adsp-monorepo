import {
  ActionTypes,
  DELETE_APPLICATION_SUCCESS_ACTION,
  FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION,
  FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION,
  FETCH_SERVICE_ALL_STATUS_APP_HEALTH_SUCCESS_ACTION,
  FETCH_STATUS_METRICS_SUCCESS_ACTION,
  SAVE_APPLICATION_SUCCESS_ACTION,
  SET_APPLICATION_SUCCESS_STATUS_ACTION,
  TOGGLE_APPLICATION_SUCCESS_STATUS_ACTION,
  UPDATE_FORM_DATA_ACTION,
  FETCH_STATUS_CONFIGURATION_SUCCEEDED,
  UPDATE_STATUS_CONTACT_INFORMATION,
  FETCH_WEBHOOK_SUCCESS_ACTION,
  DELETE_WEBHOOK_SUCCESS_ACTION,
  SAVE_WEBHOOK_SUCCESS_ACTION,
  TEST_WEBHOOK_SUCCESS_ACTION,
} from './actions';
import { ServiceStatus } from './models';
import { EndpointStatusEntry } from './models';

const initialState: ServiceStatus = {
  applications: [],
  webhooks: {},
  endpointHealth: {},
  currentFormData: {
    name: '',
    appKey: '',
    tenantId: '',
    enabled: false,
    description: '',
    endpoint: { url: '', status: 'offline' },
  },
  metrics: {},
  contact: {
    contactEmail: null,
  },
  testSuccess: 0,
};

const compareIds = (a: { appKey?: string }, b: { appKey?: string }): number => (a.appKey > b.appKey ? 1 : -1);

export default function statusReducer(state: ServiceStatus = initialState, action: ActionTypes): ServiceStatus {
  switch (action.type) {
    case FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION: {
      const configurationApps = action.payload.sort(compareIds);
      return { ...state, applications: configurationApps };
    }

    case FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION:
      return {
        ...state,
        endpointHealth: {
          ...state.endpointHealth,
          [action.payload.appKey]: { url: action.payload.url, entries: action.payload.entries || [] },
        },
      };
    case FETCH_SERVICE_ALL_STATUS_APP_HEALTH_SUCCESS_ACTION: {
      const { entries } = action.payload;

      interface EndpointHealthMap {
        [appId: string]: { url: string; entries: EndpointStatusEntry[] };
      }

      const endpointHealth = entries.reduce<EndpointHealthMap>((acc, entry) => {
        const key = entry.applicationId; // or entry.appKey if you prefer

        if (!acc[key]) {
          acc[key] = { url: entry.url, entries: [] };
        }

        acc[key].entries.push(entry);

        return acc;
      }, {} as Record<string, { url: string; entries: EndpointStatusEntry[] }>);

      return {
        ...state,
        endpointHealth: endpointHealth,
      };
    }
    case TEST_WEBHOOK_SUCCESS_ACTION: {
      return { ...state, testSuccess: state.testSuccess + 1 };
    }
    case DELETE_APPLICATION_SUCCESS_ACTION:
      return {
        ...state,
        applications: [...state.applications.filter((app) => app.appKey !== action.payload)].sort(compareIds),
      };
    case SAVE_APPLICATION_SUCCESS_ACTION:
    case SET_APPLICATION_SUCCESS_STATUS_ACTION: {
      const index = state.applications.findIndex((app) => {
        return app.appKey === action.payload.appKey;
      });
      if (index !== -1) {
        state.applications[index] = action.payload;
      } else {
        state.applications = [action.payload, ...state.applications].sort(compareIds);
      }
      return { ...state };
    }
    case SAVE_WEBHOOK_SUCCESS_ACTION: {
      const webhooks = action.payload;
      const hookIntervalList = Object.keys(action.hookIntervals).map((h) => {
        return action.hookIntervals[h];
      });

      Object.keys(webhooks).forEach((key) => {
        if (webhooks[key]) {
          webhooks[key].intervalMinutes = hookIntervalList.find(
            (i) => i.appId === webhooks[key]?.targetId
          )?.waitTimeInterval;
        }
      });
      return { ...state, webhooks: webhooks };
    }
    case TOGGLE_APPLICATION_SUCCESS_STATUS_ACTION:
      return {
        ...state,
        applications: state.applications
          .map((app) =>
            app.appKey !== action.payload.appKey
              ? { ...app }
              : { ...app, enabled: action.payload.enabled, internalStatus: action.payload.internalStatus }
          )
          .sort(compareIds),
      };
    case FETCH_WEBHOOK_SUCCESS_ACTION: {
      const webhooks = action.payload;

      const hookIntervalList = Object.keys(action.hookIntervals).map((h) => {
        return action.hookIntervals[h];
      });

      webhooks &&
        Object.keys(webhooks).forEach((key) => {
          if (webhooks[key]) {
            webhooks[key].intervalMinutes = hookIntervalList.find(
              (i) => i.appId === webhooks[key].targetId
            )?.waitTimeInterval;
          }
        });

      return {
        ...state,
        webhooks: webhooks,
      };
    }
    case DELETE_WEBHOOK_SUCCESS_ACTION: {
      const deletedWebhook = Object.keys(state.webhooks).find((hook) => hook === action.payload);

      delete state.webhooks[deletedWebhook];
      return { ...state, webhooks: { ...state.webhooks } };
    }
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
