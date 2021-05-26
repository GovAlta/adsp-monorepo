interface Params {
  tenantId: string;
  applicationId: string;
}

export const DELETE_APPLICATION_ACTION = 'status/DELETE_APPLICATION';
export const DELETE_APPLICATION_SUCCESS_ACTION = 'status/DELETE_APPLICATION_SUCCESS';

export interface DeleteApplicationAction {
  type: typeof DELETE_APPLICATION_ACTION;
  payload: Params;
}

export interface DeleteApplicationSuccessAction {
  type: typeof DELETE_APPLICATION_SUCCESS_ACTION;
  payload: string;
}

export const deleteApplication = (payload: Params): DeleteApplicationAction => ({
  type: 'status/DELETE_APPLICATION',
  payload,
});
export const deleteApplicationSuccess = (payload: string): DeleteApplicationSuccessAction => ({
  type: 'status/DELETE_APPLICATION_SUCCESS',
  payload,
});
