import { EndpointStatusEntry, ApplicationStatus } from '../models';

export const FETCH_SERVICE_STATUS_APPS_ACTION = 'status/FETCH_SERVICE_STATUS_APPS';
export const FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION = 'status/FETCH_SERVICE_STATUS_APPS_SUCCESS';

export const FETCH_SERVICE_STATUS_APP_HEALTH_ACTION = 'status/FETCH_SERVICE_STATUS_APP_HEALTH';
export const FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION = 'status/FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS';
export const FETCH_SERVICE_ALL_STATUS_APP_HEALTH_SUCCESS_ACTION =
  'status/FETCH_SERVICE_ALL_STATUS_APP_HEALTH_SUCCESS_ACTION';

export interface FetchServiceStatusApps {
  type: typeof FETCH_SERVICE_STATUS_APPS_ACTION;
}

export interface FetchServiceStatusAppsSuccessAction {
  type: typeof FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION;
  payload: ApplicationStatus[];
}

export interface FetchServiceStatusAppHealthAction {
  type: typeof FETCH_SERVICE_STATUS_APP_HEALTH_ACTION;
  payload: {
    appKey: string;
  };
}

export interface FetchServiceStatusAppHealthSuccessAction {
  type: typeof FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION;
  payload: {
    appKey: string;
    url: string;
    entries: EndpointStatusEntry[];
  };
}
export interface FetchServiceAllStatusAppHealthSuccessAction {
  type: typeof FETCH_SERVICE_ALL_STATUS_APP_HEALTH_SUCCESS_ACTION;
  payload: {
    entries: EndpointStatusEntry[];
  };
}

export const fetchServiceStatusApps = (): FetchServiceStatusApps => ({
  type: FETCH_SERVICE_STATUS_APPS_ACTION,
});

export const fetchServiceStatusAppsSuccess = (payload: ApplicationStatus[]): FetchServiceStatusAppsSuccessAction => ({
  type: FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION,
  payload,
});

export const fetchServiceStatusAppHealth = (appKey: string): FetchServiceStatusAppHealthAction => ({
  type: FETCH_SERVICE_STATUS_APP_HEALTH_ACTION,
  payload: { appKey },
});

export const fetchServiceStatusAppHealthSuccess = (
  appKey: string,
  url: string,
  entries: EndpointStatusEntry[]
): FetchServiceStatusAppHealthSuccessAction => ({
  type: FETCH_SERVICE_STATUS_APP_HEALTH_SUCCESS_ACTION,
  payload: {
    appKey,
    url,
    entries,
  },
});

export const fetchServiceAllStatusAppHealthSuccess = (
  entries: EndpointStatusEntry[]
): FetchServiceAllStatusAppHealthSuccessAction => ({
  type: FETCH_SERVICE_ALL_STATUS_APP_HEALTH_SUCCESS_ACTION,
  payload: {
    entries,
  },
});
