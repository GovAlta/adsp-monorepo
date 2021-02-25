import React, { useEffect } from 'react';
import Header from '../../header';
import { useSelector, useDispatch } from 'react-redux';
import { TYPES } from '../../store/actions';
import Keycloak from 'keycloak-js';
import { Redirect, useParams } from 'react-router-dom';
import { RootState } from '../../store/reducers';

interface TennatTypes {
  tenantName: string;
}

function TenantLogin() {
  const keycloakConfig = useSelector(
    (state: RootState) => state.config.keycloak
  );

  const isAuthenticated = useSelector(
    (state: RootState) => state.user.authenticated
  );

  const dispatch = useDispatch();

  // TODO: fetch the tenantName-realm mapping
  const { tenantName } = useParams<TennatTypes>();

  const login = () => {
    const keycloak = Keycloak(keycloakConfig);
    keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
      // TODO: Add error handling if the keycloak server is down.
      if (authenticated) {
        keycloak.loadUserInfo().then(() => {
          // User roles are 1in the keycloak.tokenParsed
          dispatch({ type: TYPES.USER_LOGIN_SUCCESS, keycloak });
        });
      } else {
        // TODO: need UI design
        alert('Login Failed');
      }
    });
  };

  useEffect(login);

  if (isAuthenticated) {
    return <Redirect to="/tenant-admin" />;
  }

  return (
    <div>
      <Header isLoginLink={false} />
    </div>
  );
}

export default TenantLogin;
