// Types for file service
export const FETCH_FILE = 'tenant/file-service/toggle';
export const FILE_DELETE = 'tenant/file-service/delete';
export const FETCH_FILE_SPACE = 'tenant/file-service/space/fetch';
export const FETCH_FILE_SPACE_SUCCEEDED =
  'tenant/file-service/space/fetch/successed';

// The FILE_SETUP is only for testing
export const FILE_SETUP = 'tenant/file-service/setup';

export const FILE_ENABLE = 'tenant/file-service/activation/activate';
export const FILE_DISABLE = 'tenant/file-service/activation/';

export const FILE_SET_ACTIVE_TAB = 'tenant/file-service/states/tabs/active';

export const USER_LOGIN_SUCCESS = 'user/login/success';
export const USER_LOGIN_FAILED = 'user/login/failed';
export const USER_LOGOUT = 'user/logout';

// Types for server service
export const SERVER_STATUS = 'server/status/health';
export const SERVER_STATUS_FETCH = 'server/status/health/fetch';

export const UPTIME_FETCH = 'UPTIME_FETCH';
export const UPTIME_FETCH_SUCCEEDED = 'UPTIME_FETCH_SUCCEEDED';
export const UPTIME_FETCH_FAILED = 'UPTIME_FETCH_FAILED';

// Types for tenant information
export const FETCH_TENANT_INFO_SUCCESS = 'GET_TENANT_INFO_SUCCESS';
export const FETCH_TENANT_INFO_FAILED = 'GET_TENANT_INFO_FAILED';

// Generic Types
export const HTTP_ERROR = 'helper/http/error';
