import { ServiceStatusApplication } from '../models';

interface Params {
  tenantId: string;
  applicationId: string;

  enabled: boolean;
}

export const TOGGLE_APPLICATION_ACTION = 'status/TOGGLE_APPLICATION';
export const TOGGLE_APPLICATION_SUCCESS_ACTION = 'status/TOGGLE_APPLICATION_SUCCESS';

export interface ToggleApplicationAction {
  type: typeof TOGGLE_APPLICATION_ACTION;
  payload: Params;
}

export interface ToggleApplicationSuccessAction {
  type: typeof TOGGLE_APPLICATION_SUCCESS_ACTION;
  payload: ServiceStatusApplication;
}

export const toggleApplication = (payload: Params): ToggleApplicationAction => ({
  type: 'status/TOGGLE_APPLICATION',
  payload,
});
export const toggleApplicationSuccess = (payload: ServiceStatusApplication): ToggleApplicationSuccessAction => ({
  type: 'status/TOGGLE_APPLICATION_SUCCESS',
  payload,
});
