import { ServiceStatusApplication } from '../models';

export const FETCH_SERVICE_STATUS_APPS_ACTION = 'status/FETCH_SERVICE_STATUS_APPS';
export const FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION = 'status/FETCH_SERVICE_STATUS_APPS_SUCCESS';

export interface FetchServiceStatusApps {
  type: typeof FETCH_SERVICE_STATUS_APPS_ACTION;
}

export interface FetchServiceStatusAppsSuccessAction {
  type: typeof FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION;
  payload: ServiceStatusApplication[];
}

export const fetchServiceStatusApps = (): FetchServiceStatusApps => ({
  type: 'status/FETCH_SERVICE_STATUS_APPS',
});

export const fetchServiceStatusAppsSuccess = (
  payload: ServiceStatusApplication[]
): FetchServiceStatusAppsSuccessAction => ({
  type: 'status/FETCH_SERVICE_STATUS_APPS_SUCCESS',
  payload,
});
