import { createSelector } from 'reselect';
import { RootState } from '../../store';

export const selectRegisterData = createSelector(
  (state: RootState) => state,
  (state) => {
    return state?.configuration?.registers;
  }
);
