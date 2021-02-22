import { TYPES } from '../actions';
import INIT_STATE from './initialState';

export default function (state = INIT_STATE.user, action) {
  if (action.type === TYPES.USER_LOGIN_SUCCESS) {
    const keycloak = action.keycloak;
    const jwt = {
      exp: keycloak.tokenParsed.exp,
      token: keycloak.token,
    };

    // TODO: fetching jwt from keycloak might be a bad idea
    return {
      ...state,
      keycloak: keycloak,
      authenticated: true,
      username: keycloak.userInfo.preferred_username || 'Guest',
      jwt: jwt,
    };
  }

  if (action.type === TYPES.USER_LOGOUT) {
    return INIT_STATE.user;
  }

  return state;
}
