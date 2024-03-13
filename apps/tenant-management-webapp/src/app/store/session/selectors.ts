import { RootState } from '@store/index';
import { toKebabName } from '@lib/kebabName';
import { createSelector } from 'reselect';
import { UserInfo } from './models';

export const selectModalStateByType = (Type) => (state: RootState) => {
  return { ...state.session?.modal?.[Type] };
};

export const selectTenantName = (state: RootState) => {
  return state.tenant?.name;
};

export const selectPageIndicator = (state: RootState) => {
  return state?.session?.indicator;
};

export const selectTenantKebabName = createSelector(selectTenantName, (tenantName) => {
  return tenantName ? toKebabName(tenantName) : '';
});

export const selectUserInfo = (state: RootState) => {
  return { ...state?.session?.userInfo };
};

export const selectUserName = createSelector(selectUserInfo, (userInfo: UserInfo) => {
  return userInfo?.name;
});

export const selectUserEmail = createSelector(selectUserInfo, (userInfo: UserInfo) => {
  return userInfo?.email;
});

export const selectIsAuthenticated = (state: RootState) => {
  return state?.session?.authenticated === true;
};

export const findActionState = (state: RootState, action) => {
  const loadingStates = state.session?.loadingStates;
  const loadingState = loadingStates.find((state) => state.name === action);
  return loadingState;
};

export const selectActionStateStart = (action) => (state: RootState) => {
  const loadingState = findActionState(state, action);
  return loadingState && loadingState?.state === 'start';
};

export const selectActionStateCompleted = (action) => (state: RootState) => {
  const loadingState = findActionState(state, action);
  return loadingState && loadingState?.state === 'completed';
};
