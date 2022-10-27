import { ApplicationStatus } from '../models';

interface Params {
  tenantId: string;
  appKey: string;
  enabled: boolean;
}

export const TOGGLE_APPLICATION_STATUS_ACTION = 'status/TOGGLE_APPLICATION_STATUS';
export const TOGGLE_APPLICATION_SUCCESS_STATUS_ACTION = 'status/TOGGLE_APPLICATION_STATUS_SUCCESS';
export interface ToggleApplicationStatusAction {
  type: typeof TOGGLE_APPLICATION_STATUS_ACTION;
  payload: Params;
}

export interface ToggleApplicationStatusSuccessAction {
  type: typeof TOGGLE_APPLICATION_SUCCESS_STATUS_ACTION;
  payload: ApplicationStatus;
}

export const toggleApplicationStatus = (payload: Params): ToggleApplicationStatusAction => ({
  type: 'status/TOGGLE_APPLICATION_STATUS',
  payload,
});

export const toggleApplicationStatusSuccess = (payload: ApplicationStatus): ToggleApplicationStatusSuccessAction => ({
  type: 'status/TOGGLE_APPLICATION_STATUS_SUCCESS',
  payload,
});
