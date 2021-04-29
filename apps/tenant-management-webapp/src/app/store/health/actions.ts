import { ServiceStatus } from './models';

// *****
// Types
// *****

const FETCH_HEALTH_ACTION = 'health/FETCH_HEALTH';
const FETCH_HEALTH_SUCCESS_ACTION = 'health/FETCH_HEALTH_SUCCESS';

export { FETCH_HEALTH_ACTION };

// *******
// Actions
// *******

export interface FetchHealthAction {
  type: typeof FETCH_HEALTH_ACTION;
  payload: string;
}

export interface FetchHealthSuccessAction {
  type: typeof FETCH_HEALTH_SUCCESS_ACTION;
  payload: ServiceStatus;
}

export type ActionTypes = FetchHealthAction | FetchHealthSuccessAction;

// *********
// Functions
// *********
const fetchHealth = (name: string): FetchHealthAction => ({
  type: 'health/FETCH_HEALTH',
  payload: name
});

const fetchHealthSuccess = (payload: ServiceStatus): FetchHealthSuccessAction => ({
  type: 'health/FETCH_HEALTH_SUCCESS',
  payload,
});

export { fetchHealth, fetchHealthSuccess };
