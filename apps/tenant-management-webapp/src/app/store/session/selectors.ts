import { RootState } from '@store/index';
import { toKebabName } from '@lib/kebabName';
import { createSelector } from 'reselect';

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
