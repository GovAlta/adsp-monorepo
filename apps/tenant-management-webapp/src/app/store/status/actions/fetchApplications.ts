import { EndpointStatusEntry, ServiceStatusApplication } from '../models';

export const FETCH_SERVICE_STATUS_APPS_ACTION = 'status/FETCH_SERVICE_STATUS_APPS';
export const FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION = 'status/FETCH_SERVICE_STATUS_APPS_SUCCESS';

export const FETCH_SERVICE_STATUS_APP_HEALTH_ACTION = 'status/FETCH_SERVICE_STATUS_APP_HEALTH';
export const FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION = 'status/FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS';

export interface FetchServiceStatusApps {
  type: typeof FETCH_SERVICE_STATUS_APPS_ACTION;
}

export interface FetchServiceStatusAppsSuccessAction {
  type: typeof FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION;
  payload: ServiceStatusApplication[];
}

export interface FetchServiceStatusAppHealthAction {
  type: typeof FETCH_SERVICE_STATUS_APP_HEALTH_ACTION;
  payload: {
    applicationId: string;
  };
}

export interface FetchServiceStatusAppHealthSuccessAction {
  type: typeof FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION;
  payload: {
    applicationId: string;
    entries: EndpointStatusEntry[];
  };
}

export const fetchServiceStatusApps = (): FetchServiceStatusApps => ({
  type: FETCH_SERVICE_STATUS_APPS_ACTION,
});

export const fetchServiceStatusAppsSuccess = (
  payload: ServiceStatusApplication[]
): FetchServiceStatusAppsSuccessAction => ({
  type: FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION,
  payload,
});

export const fetchServiceStatusAppHealth = (applicationId: string): FetchServiceStatusAppHealthAction => ({
  type: FETCH_SERVICE_STATUS_APP_HEALTH_ACTION,
  payload: { applicationId },
});

export const fetchServiceStatusAppHealthSuccess = (
  applicationId: string,
  entries: EndpointStatusEntry[]
): FetchServiceStatusAppHealthSuccessAction => ({
  type: FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION,
  payload: {
    applicationId,
    entries,
  },
});
