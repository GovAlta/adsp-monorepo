import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { createUserRegisterData } from '@abgov/jsonforms-components';
export const selectRegisterData = createSelector(
  (state: RootState) => state,
  (state) => {
    const { name, email } = state.session.userInfo;
    return [
      ...state?.configuration?.registers,
      createUserRegisterData({
        firstName: name.split(' ')[0],
        lastName: name.split(' ').pop(),
        email,
      }),
    ];
  }
);
