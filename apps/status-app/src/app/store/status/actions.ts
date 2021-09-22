import { Notice, ServiceStatusApplication } from './models'
export const FETCH_NOTICES_ACTION = 'status/notices/fetch';
export const FETCH_NOTICES_SUCCESS_ACTION = 'status/notices/fetch/success';
export const FETCH_APPLICATIONS_ACTION = 'status/applications/fetch';
export const FETCH_APPLICATIONS_SUCCESS_ACTION = 'status/applications/fetch/success';

export type ActionTypes =
  | FetchNoticesAction
  | FetchNoticesSuccessAction
  | FetchApplicationsAction
  | FetchApplicationsSuccessAction

export interface FetchNoticesSuccessAction {
  type: typeof FETCH_NOTICES_SUCCESS_ACTION;
  payload: Notice[]
}

export interface FetchApplicationsAction {
  type: typeof FETCH_APPLICATIONS_ACTION
  payload: string;
}

export interface FetchApplicationsSuccessAction {
  type: typeof FETCH_APPLICATIONS_SUCCESS_ACTION
  payload: ServiceStatusApplication[]
}

export interface FetchNoticesAction {
  type: typeof FETCH_NOTICES_ACTION;
  payload?: string

}

export const fetchNotices = (realm: string): FetchNoticesAction => ({
  type: 'status/notices/fetch',
  payload: realm,
});

export const fetchNoticesSuccess = (payload: Notice[]): FetchNoticesSuccessAction => ({
  type: 'status/notices/fetch/success',
  payload,
});

export const fetchApplications = (realm: string): FetchApplicationsAction => ({
  type: 'status/applications/fetch',
  payload: realm
});

export const fetchApplicationsSuccess = (payload: ServiceStatusApplication[]): FetchApplicationsSuccessAction => ({
  type: 'status/applications/fetch/success',
  payload
})
