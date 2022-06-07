import {
  FETCH_SERVICES_SUCCESS_ACTION,
  FETCH_SERVICE_METRICS_ACTION,
  FETCH_SERVICE_METRICS_SUCCESS_ACTION,
  ServiceMetricsActionTypes,
  SET_INTERVAL_CRITERIA_ACTION,
  SET_SERVICE_CRITERIA_ACTION,
} from './actions';
import { ServiceMetricsState } from './models';

const defaultState: ServiceMetricsState = {
  services: [],
  criteria: {
    service: null,
    chartInterval: '1 hour',
  },
  isLoading: false,
  intervalMin: null,
  intervalMax: null,
  responseTimes: [],
  counts: [],
};

export default function (
  state: ServiceMetricsState = defaultState,
  action: ServiceMetricsActionTypes
): ServiceMetricsState {
  switch (action.type) {
    case SET_SERVICE_CRITERIA_ACTION:
      return {
        ...state,
        criteria: {
          ...state.criteria,
          service: action.service,
        },
      };
    case SET_INTERVAL_CRITERIA_ACTION:
      return {
        ...state,
        criteria: {
          ...state.criteria,
          chartInterval: action.chartInterval,
        },
      };
    case FETCH_SERVICES_SUCCESS_ACTION:
      return {
        ...state,
        services: action.services,
      };
    case FETCH_SERVICE_METRICS_ACTION:
      return {
        ...state,
        isLoading: true,
      };
    case FETCH_SERVICE_METRICS_SUCCESS_ACTION:
      return {
        ...state,
        isLoading: false,
        intervalMin: action.intervalMin,
        intervalMax: action.intervalMax,
        responseTimes: action.responseTimes,
        counts: action.counts,
      };
    default:
      return state;
  }
}
