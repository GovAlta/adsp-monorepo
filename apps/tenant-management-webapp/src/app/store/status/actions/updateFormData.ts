import { ApplicationStatus } from '../models';

export const UPDATE_FORM_DATA_ACTION = 'status/UPDATE_FORM_DATA';

export interface UpdateFormDataAction {
  type: typeof UPDATE_FORM_DATA_ACTION;
  payload: ApplicationStatus;
}

export const updateFormData = (payload: ApplicationStatus): UpdateFormDataAction => ({
  type: 'status/UPDATE_FORM_DATA',
  payload,
});
