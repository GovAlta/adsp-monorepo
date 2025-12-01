import { createSelector } from 'reselect';

import { AppState } from '../store';

export const selectRegisterData = createSelector(
  (state: AppState) => state,
  (state) => {
    return state?.configuration?.registerData;
  }
);
