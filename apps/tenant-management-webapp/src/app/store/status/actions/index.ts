import * as fetch from './fetchApplications';
import * as get from './getApplication';
import * as save from './saveApplication';
import * as destroy from './deleteApplication';
import * as toggle from './toggleApplication';

export * from './fetchApplications';
export * from './getApplication';
export * from './saveApplication';
export * from './deleteApplication';
export * from './toggleApplication';

export type ActionTypes =
  | fetch.FetchServiceStatusAppsSuccessAction
  | save.SaveApplicationSuccessAction
  | get.GetApplicationSuccessAction
  | destroy.DeleteApplicationSuccessAction
  | toggle.ToggleApplicationSuccessAction;
