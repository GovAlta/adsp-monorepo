import * as TYPES from './types';

export const getTenantInfo = (realm) => {
  return {
    type: TYPES.FETCH_TENANT_INFO_SUCCESS,
    realm,
  };
};
