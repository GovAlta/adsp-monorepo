import { Notice, ServiceStatusApplication, Subscriber } from './models';
export const FETCH_NOTICES_ACTION = 'status/notices/fetch';
export const FETCH_NOTICES_SUCCESS_ACTION = 'status/notices/fetch/success';
export const FETCH_APPLICATIONS_ACTION = 'status/applications/fetch';
export const FETCH_APPLICATIONS_SUCCESS_ACTION = 'status/applications/fetch/success';
export const SUBSCRIBE_TO_TENANT = 'status/subscribe/to/tenant';
export const SUBSCRIBE_TO_TENANT_SUCCESS_ACTION = 'status/subscribe/to/tenant/success';

export type ActionTypes =
  | FetchNoticesAction
  | FetchNoticesSuccessAction
  | FetchApplicationsAction
  | FetchApplicationsSuccessAction
  | SubscribeToTenantSuccessAction
  | SubscribeToTenantAction;
export interface FetchNoticesSuccessAction {
  type: typeof FETCH_NOTICES_SUCCESS_ACTION;
  payload: Notice[];
}

export interface FetchApplicationsAction {
  type: typeof FETCH_APPLICATIONS_ACTION;
  payload: string;
}

export interface SubscribeToTenantAction {
  type: typeof SUBSCRIBE_TO_TENANT;
  payload: { tenant: string; email: string };
}

export interface FetchApplicationsSuccessAction {
  type: typeof FETCH_APPLICATIONS_SUCCESS_ACTION;
  payload: ServiceStatusApplication[];
}

export interface SubscribeToTenantSuccessAction {
  type: typeof SUBSCRIBE_TO_TENANT_SUCCESS_ACTION;
  payload: Subscriber;
}

export interface FetchNoticesAction {
  type: typeof FETCH_NOTICES_ACTION;
  payload?: string;
}

export const fetchNotices = (realm: string): FetchNoticesAction => ({
  type: 'status/notices/fetch',
  payload: realm,
});

export const subscribeToTenant = (payload: { tenant: string; email: string }): SubscribeToTenantAction => ({
  type: 'status/subscribe/to/tenant',
  payload: payload,
});

export const fetchNoticesSuccess = (payload: Notice[]): FetchNoticesSuccessAction => ({
  type: 'status/notices/fetch/success',
  payload,
});

export const fetchApplications = (realm: string): FetchApplicationsAction => ({
  type: 'status/applications/fetch',
  payload: realm,
});

export const fetchApplicationsSuccess = (payload: ServiceStatusApplication[]): FetchApplicationsSuccessAction => ({
  type: 'status/applications/fetch/success',
  payload,
});

export const subscribeToTenantSuccess = (payload: Subscriber): SubscribeToTenantSuccessAction => ({
  type: 'status/subscribe/to/tenant/success',
  payload,
});
