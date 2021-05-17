import { ServiceStatusApplication } from '../models';

export const GET_APPLICATION_ACTION = 'status/GET_APPLICATION';
export const GET_APPLICATION_SUCCESS_ACTION = 'status/GET_APPLICATION_SUCCESS';

export interface GetApplicationAction {
  type: typeof GET_APPLICATION_ACTION;
  payload: ServiceStatusApplication;
}

export interface GetApplicationSuccessAction {
  type: typeof GET_APPLICATION_SUCCESS_ACTION;
  payload: ServiceStatusApplication;
}

export const getApplication = (payload: ServiceStatusApplication): GetApplicationAction => ({
  type: 'status/GET_APPLICATION',
  payload,
});

export const getApplicationSuccess = (payload: ServiceStatusApplication): GetApplicationSuccessAction => ({
  type: 'status/GET_APPLICATION_SUCCESS',
  payload,
});
