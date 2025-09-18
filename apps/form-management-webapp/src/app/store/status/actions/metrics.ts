import { ServiceStatusMetrics } from '../models';

export const FETCH_STATUS_METRICS_ACTION = 'status/FETCH_STATUS_METRICS';
export const FETCH_STATUS_METRICS_SUCCESS_ACTION = 'status/FETCH_STATUS_METRICS_SUCCESS';

export interface FetchStatusMetricsAction {
  type: typeof FETCH_STATUS_METRICS_ACTION;
}

export interface FetchStatusMetricsSuccessAction {
  type: typeof FETCH_STATUS_METRICS_SUCCESS_ACTION;
  metrics: ServiceStatusMetrics;
}

export const fetchStatusMetrics = (): FetchStatusMetricsAction => ({
  type: FETCH_STATUS_METRICS_ACTION,
});

export const fetchStatusMetricsSucceeded = (metrics: ServiceStatusMetrics): FetchStatusMetricsSuccessAction => ({
  type: FETCH_STATUS_METRICS_SUCCESS_ACTION,
  metrics,
});
