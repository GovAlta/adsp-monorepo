import { executeGetWithAccessToken } from './http';

export const getTenantByRealm = async (url) => {
  return executeGetWithAccessToken(url);
};
