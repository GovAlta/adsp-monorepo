import { ServiceStatusApplication } from '../models';

export const SAVE_APPLICATION_ACTION = 'status/SAVE_APPLICATION';
export const SAVE_APPLICATION_SUCCESS_ACTION = 'status/SAVE_APPLICATION_SUCCESS';

export interface SaveApplicationAction {
  type: typeof SAVE_APPLICATION_ACTION;
  payload: ServiceStatusApplication;
}

export interface SaveApplicationSuccessAction {
  type: typeof SAVE_APPLICATION_SUCCESS_ACTION;
  payload: ServiceStatusApplication;
}

export const saveApplication = (payload: ServiceStatusApplication): SaveApplicationAction => ({
  type: 'status/SAVE_APPLICATION',
  payload,
});

export const saveApplicationSuccess = (payload: ServiceStatusApplication): SaveApplicationSuccessAction => ({
  type: 'status/SAVE_APPLICATION_SUCCESS',
  payload,
});
