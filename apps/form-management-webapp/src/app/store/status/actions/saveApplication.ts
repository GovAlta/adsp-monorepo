import { ApplicationStatus } from '../models';

export const SAVE_APPLICATION_ACTION = 'status/SAVE_APPLICATION';
export const SAVE_APPLICATION_SUCCESS_ACTION = 'status/SAVE_APPLICATION_SUCCESS';

export interface SaveApplicationAction {
  type: typeof SAVE_APPLICATION_ACTION;
  payload: ApplicationStatus;
}

export interface SaveApplicationSuccessAction {
  type: typeof SAVE_APPLICATION_SUCCESS_ACTION;
  payload: ApplicationStatus;
}

export const saveApplication = (payload: ApplicationStatus): SaveApplicationAction => ({
  type: 'status/SAVE_APPLICATION',
  payload,
});

export const saveApplicationSuccess = (payload: ApplicationStatus): SaveApplicationSuccessAction => ({
  type: 'status/SAVE_APPLICATION_SUCCESS',
  payload,
});
