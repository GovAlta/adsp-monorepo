import { ChartInterval, MetricValue } from './models';

export const FETCH_SERVICES_ACTION = 'metrics/FETCH_SERVICES_ACTION';
export const FETCH_SERVICES_SUCCESS_ACTION = 'metrics/FETCH_SERVICES_SUCCESS_ACTION';

export const SET_INTERVAL_CRITERIA_ACTION = 'metrics/SET_INTERVAL_CRITERIA_ACTION';
export const SET_SERVICE_CRITERIA_ACTION = 'metrics/SET_SERVICE_CRITERIA_ACTION';

export const FETCH_SERVICE_METRICS_ACTION = 'metrics/FETCH_SERVICE_METRICS_ACTION';
export const FETCH_SERVICE_METRICS_SUCCESS_ACTION = 'metrics/FETCH_SERVICE_METRICS_SUCCESS_ACTION';

export interface SetIntervalCriteriaAction {
  type: typeof SET_INTERVAL_CRITERIA_ACTION;
  chartInterval: ChartInterval;
}

export interface SetServiceCriteriaAction {
  type: typeof SET_SERVICE_CRITERIA_ACTION;
  service: string;
}

export interface FetchServicesAction {
  type: typeof FETCH_SERVICES_ACTION;
}

export interface FetchServicesSuccessAction {
  type: typeof FETCH_SERVICES_SUCCESS_ACTION;
  services: string[];
}

export interface FetchServiceMetricsAction {
  type: typeof FETCH_SERVICE_METRICS_ACTION;
  service: string;
  chartInterval: ChartInterval;
}

export interface FetchServiceMetricsSuccessAction {
  type: typeof FETCH_SERVICE_METRICS_SUCCESS_ACTION;
  intervalMin: Date;
  intervalMax: Date;
  responseTimes: MetricValue[];
  counts: MetricValue[];
}

export type ServiceMetricsActionTypes =
  | SetIntervalCriteriaAction
  | SetServiceCriteriaAction
  | FetchServicesAction
  | FetchServicesSuccessAction
  | FetchServiceMetricsAction
  | FetchServiceMetricsSuccessAction;

export const setIntervalCriteria = (chartInterval: ChartInterval): SetIntervalCriteriaAction => ({
  type: SET_INTERVAL_CRITERIA_ACTION,
  chartInterval,
});

export const setServiceCriteria = (service: string): SetServiceCriteriaAction => ({
  type: SET_SERVICE_CRITERIA_ACTION,
  service,
});

export const fetchServices = (): FetchServicesAction => ({
  type: FETCH_SERVICES_ACTION,
});

export const fetchServicesSuccess = (services: string[]): FetchServicesSuccessAction => ({
  type: FETCH_SERVICES_SUCCESS_ACTION,
  services,
});

export const fetchServiceMetrics = (service: string, chartInterval: ChartInterval): FetchServiceMetricsAction => ({
  type: FETCH_SERVICE_METRICS_ACTION,
  service,
  chartInterval,
});

export const fetchServiceMetricsSuccess = (
  intervalMin: Date,
  intervalMax: Date,
  responseTimes: MetricValue[],
  counts: MetricValue[]
): FetchServiceMetricsSuccessAction => ({
  type: FETCH_SERVICE_METRICS_SUCCESS_ACTION,
  intervalMin,
  intervalMax,
  responseTimes,
  counts,
});
