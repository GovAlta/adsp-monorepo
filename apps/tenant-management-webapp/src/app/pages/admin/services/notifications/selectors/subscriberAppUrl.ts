import { RootState } from '@store/index';
import { createSelector } from 'reselect';

export const subscriberAppUrlSelector = createSelector(
  (state: RootState) => state.tenant,
  (state: RootState) => state.config.serviceUrls.subscriberWebApp,
  (state, subscriberWebApp) => `${subscriberWebApp}/${state.name}/login`
);
