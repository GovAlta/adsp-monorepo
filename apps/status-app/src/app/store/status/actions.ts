import { Notice, ServiceStatusApplication, Subscriber, ContactInformation } from './models';
export const FETCH_NOTICES_ACTION = 'status/notices/fetch';
export const FETCH_NOTICES_SUCCESS_ACTION = 'status/notices/fetch/success';
export const FETCH_APPLICATIONS_ACTION = 'status/applications/fetch';
export const FETCH_APPLICATIONS_SUCCESS_ACTION = 'status/applications/fetch/success';
export const SUBSCRIBE_TO_TENANT = 'status/subscribe/to/tenant';
export const SUBSCRIBE_TO_TENANT_SUCCESS_ACTION = 'status/subscribe/to/tenant/success';
export const FETCH_CONTACT_INFO = 'status/status-contact-info';
export const FETCH_CONTACT_INFO_SUCCEEDED = 'status/status-contact-info-succeeded';

export type ActionTypes =
  | FetchNoticesAction
  | FetchNoticesSuccessAction
  | FetchApplicationsAction
  | FetchApplicationsSuccessAction
  | SubscribeToTenantSuccessAction
  | FetchContactInfoSucceededAction
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
  payload: { tenant: string; email: string; type: string };
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

export interface FetchContactInfoAction {
  type: typeof FETCH_CONTACT_INFO;
  payload: {
    name: string;
  };
}

interface FetchContactInfoSucceededAction {
  type: typeof FETCH_CONTACT_INFO_SUCCEEDED;
  payload: {
    contactInfo: ContactInformation;
  };
}

export const fetchNotices = (realm: string): FetchNoticesAction => ({
  type: 'status/notices/fetch',
  payload: realm,
});

export const subscribeToTenant = (payload: {
  tenant: string;
  email: string;
  type: string;
}): SubscribeToTenantAction => ({
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

export const FetchContactInfoSucceededService = (contactInfo: ContactInformation): FetchContactInfoSucceededAction => ({
  type: FETCH_CONTACT_INFO_SUCCEEDED,
  payload: {
    contactInfo,
  },
});

export const FetchContactInfoService = (name: string): FetchContactInfoAction => ({
  type: FETCH_CONTACT_INFO,
  payload: {
    name,
  },
});
