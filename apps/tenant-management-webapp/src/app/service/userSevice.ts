import { CONFIG_INIT } from '../store/reducers/config.contract';

import Keycloak from 'keycloak-js';
import { setAuthToken } from '../api/http';
const keycloak = Keycloak(CONFIG_INIT.keycloak);

const login = (onLoginCallback, onLoginError) => {
  keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
    // TODO: Add error handling if the keycloak server is down.

    // Get token to check is tenant exist in db
    // if yes, login sucessful otherwise login failed.

    if (authenticated) {
      setAuthToken(keycloak.token);
      onLoginCallback(keycloak);
      keycloak.login();
    } else {
      onLoginError();
    }
  });
};

const logout = () => {
  keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
    if (authenticated) {
      keycloak.logout();
      setAuthToken(null);
    } else {
      // If keycloak successfuly logout, it will redirect to the logout page again.
      // After confirm that we have successfully logout and we can update the state.
      // Another way of achieving this is to add async wrapper on the keycloak logout function.
      // Paul tried: keycloak.logout().then. And, this does not work.
    }
  });
};

const getToken = () => keycloak.token;

const isLoggedIn = () => !!keycloak.token;

const hasRole = (roles) => roles.some((role) => keycloak.hasRealmRole(role));

const UserService = {
  login,
  logout,
  isLoggedIn,
  getToken,
  hasRole,
};

export default UserService;
