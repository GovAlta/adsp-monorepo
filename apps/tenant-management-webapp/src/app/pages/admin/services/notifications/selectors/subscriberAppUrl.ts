import { RootState } from '@store/index';
import { createSelector } from 'reselect';

export const subscriberAppUrlSelector = createSelector(
  (state: RootState) => state.session,
  (state: RootState) => state.config.serviceUrls.subscriberWebApp,
  (session, subscriberWebApp) => `${subscriberWebApp}/${session.realm}/login`
);
