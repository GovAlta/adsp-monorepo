import { ApplicationStatus, ServiceStatusType } from '../models';

interface Params {
  tenantId: string;
  appKey: string;
  status: ServiceStatusType;
}

export const SET_APPLICATION_STATUS_ACTION = 'status/SET_APPLICATION_STATUS';
export const SET_APPLICATION_SUCCESS_STATUS_ACTION = 'status/SET_APPLICATION_STATUS_SUCCESS';

export interface SetApplicationStatusAction {
  type: typeof SET_APPLICATION_STATUS_ACTION;
  payload: Params;
}

export interface SetApplicationStatusSuccessAction {
  type: typeof SET_APPLICATION_SUCCESS_STATUS_ACTION;
  payload: ApplicationStatus;
}

export const setApplicationStatus = (payload: Params): SetApplicationStatusAction => ({
  type: 'status/SET_APPLICATION_STATUS',
  payload,
});
export const setApplicationStatusSuccess = (payload: ApplicationStatus): SetApplicationStatusSuccessAction => ({
  type: 'status/SET_APPLICATION_STATUS_SUCCESS',
  payload,
});
