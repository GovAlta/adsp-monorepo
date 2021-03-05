import { ApiStatusState } from './models';

/**
 * Types
 */

export const API_UPTIME_FETCH_ACTION = 'api-status/uptime/fetch';
const API_UPTIME_FETCH_SUCCESS_ACTION = 'api-status/uptime/fetch_success';
const API_UPTIME_FETCH_FAILURE_ACTION = 'api-status/uptime/fetch_failure';

export interface ApiUptimeFetchAction {
  type: typeof API_UPTIME_FETCH_ACTION;
  payload: ApiStatusState;
}

export interface ApiUptimeFetchSuccessAction {
  type: typeof API_UPTIME_FETCH_SUCCESS_ACTION;
  payload: ApiStatusState;
}

export interface ApiUptimeFetchFailureAction {
  type: typeof API_UPTIME_FETCH_FAILURE_ACTION;
  payload: ApiStatusState;
}

/**
 * Functions
 */
export const ApiUptimeFetch = (): ApiUptimeFetchAction => ({
  type: API_UPTIME_FETCH_ACTION,
  payload: {
    uptime: undefined,
    status: 'fetching',
  },
});

export const ApiUptimeFetchSuccess = (uptime: number): ApiUptimeFetchSuccessAction => ({
  type: API_UPTIME_FETCH_SUCCESS_ACTION,
  payload: {
    uptime,
    status: 'loaded',
  },
});

export const ApiUptimeFetchFailure = (): ApiUptimeFetchFailureAction => ({
  type: API_UPTIME_FETCH_FAILURE_ACTION,
  payload: {
    uptime: 'Unknown',
    status: 'failed',
  },
});

export type ActionTypes = ApiUptimeFetchAction | ApiUptimeFetchSuccessAction | ApiUptimeFetchFailureAction;
