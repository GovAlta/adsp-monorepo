import * as TYPES from './types';

export const setServerHealth = (serverStatus) => {
  return {
    type: TYPES.SERVER_STATUS_FETCH,
    payload: {
      serverStatus,
    },
  };
};

export const getUptime = () => ({ type: TYPES.UPTIME_FETCH });
