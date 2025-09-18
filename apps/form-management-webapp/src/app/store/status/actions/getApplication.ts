import { ApplicationStatus } from '../models';

export const GET_APPLICATION_ACTION = 'status/GET_APPLICATION';
export const GET_APPLICATION_SUCCESS_ACTION = 'status/GET_APPLICATION_SUCCESS';

export interface GetApplicationAction {
  type: typeof GET_APPLICATION_ACTION;
  payload: ApplicationStatus;
}

export interface GetApplicationSuccessAction {
  type: typeof GET_APPLICATION_SUCCESS_ACTION;
  payload: ApplicationStatus;
}

export const getApplication = (payload: ApplicationStatus): GetApplicationAction => ({
  type: 'status/GET_APPLICATION',
  payload,
});

export const getApplicationSuccess = (payload: ApplicationStatus): GetApplicationSuccessAction => ({
  type: 'status/GET_APPLICATION_SUCCESS',
  payload,
});
