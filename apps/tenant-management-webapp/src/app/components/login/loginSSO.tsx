import React, { useEffect } from 'react';
import Header from '../../header';
import { useSelector, useDispatch } from 'react-redux';
import { TYPES, tenant } from '../../store/actions';
import Keycloak from 'keycloak-js';
import { Redirect } from 'react-router-dom';
import { RootState } from '../../store/reducers';
import { setAuthToken } from '../../api/http';

function LoginSSO() {
  const keycloakConfig = useSelector(
    (state: RootState) => state.config.keycloak
  );

  const isAuthenticated = useSelector(
    (state: RootState) => state.user.authenticated
  );

  const tenentName = useSelector(
    (state: RootState) => state.tenant.tenant.name
  );
  const dispatch = useDispatch();

  const login = () => {
    const keycloak = Keycloak(keycloakConfig);
    keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
      // TODO: Add error handling if the keycloak server is down.

      // Get token to check is tenant exist in db
      // if yes, login sucessful otherwise login failed.

      if (authenticated) {
        setAuthToken(keycloak.token);

        if (keycloak.realm) {
          dispatch(tenant.getTenantInfo(keycloak.realm));
        }

        keycloak.loadUserInfo().then(() => {
          // User roles are 1in the keycloak.tokenParsed

          if (tenentName !== null) {
            dispatch({ type: TYPES.USER_LOGIN_SUCCESS, keycloak });
          } else {
            //  TODO: need UI design
            alert('Get tenant name Failed');
          }
        });
      } else {
        // TODO: need UI design
        alert('Login Failed');
      }
    });
  };

  useEffect(login);

  if (isAuthenticated) {
    if (tenentName === null) {
      return <Redirect to="/Realms/CreateRealm" />;
    }
    return <Redirect to="/tenant-admin" />;
  }

  return (
    <div>
      <Header isLoginLink={false} />
    </div>
  );
}

export default LoginSSO;
