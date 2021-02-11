import * as TYPES from './types';


export const USER_LOGIN_SUCCESS = (loginInfo) => ({
  type: TYPES.USER_LOGIN_SUCCESS,
  payload: {
    loginInfo,
  },
});

export const USER_LOGOUT = (loginInfo) => ({
  type: TYPES.USER_LOGIN_SUCCESS,
  payload: {
    loginInfo,
  },
});