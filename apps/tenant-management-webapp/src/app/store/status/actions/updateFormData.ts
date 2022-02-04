import { ServiceStatusApplication } from '../models';

export const UPDATE_FORM_DATA_ACTION = 'status/UPDATE_FORM_DATA';

export interface UpdateFormDataAction {
  type: typeof UPDATE_FORM_DATA_ACTION;
  payload: ServiceStatusApplication;
}

export const updateFormData = (payload: ServiceStatusApplication): UpdateFormDataAction => ({
  type: 'status/UPDATE_FORM_DATA',
  payload,
});
