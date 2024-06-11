import { RootState } from '@store/index';
import { createSelector } from 'reselect';

export const taskAppUrlSelector = createSelector(
  (state: RootState) => state.tenant,
  (state: RootState) => state.config.serviceUrls.taskWebApp,
  (state, taskWebAppUrl) => `${taskWebAppUrl}/${state.name}`
);
export const taskAppLoginUrlSelector = createSelector(
  (state: RootState) => state.tenant,
  (state: RootState) => state.config.serviceUrls.taskWebApp,
  (state, taskWebApp) => `${taskWebApp}/${state.name}/login`
);
