import React, { useEffect } from 'react';
import Keycloak from 'keycloak-js';

import { useSelector, useDispatch } from 'react-redux';
import { SessionLoginSuccess } from '../../store/session/actions';
import { Redirect, useParams } from 'react-router-dom';
import { RootState } from '../../store';

import Header from '../../header';
import { ErrorNotification } from '../../store/notifications/actions';

interface TennatTypes {
  tenantName: string;
}

function TenantLogin() {
  const { keycloakConfig, isAuthenticated } = useSelector((state: RootState) => ({
    keycloakConfig: state.config?.keycloakApi,
    isAuthenticated: state.session.authenticated,
  }));
  const dispatch = useDispatch();

  // TODO: fetch the tenantName-realm mapping
  const { tenantName } = useParams<TennatTypes>();

  // login
  useEffect(() => {
    const kc = Keycloak(keycloakConfig);
    kc.init({ onLoad: 'login-required' }).then((authenticated) => {
      // TODO: Add error handling if the keycloak server is down.
      if (authenticated) {
        kc.loadUserInfo().then(() => {
          dispatch(SessionLoginSuccess(kc));
        });
      } else {
        dispatch(ErrorNotification({message: 'Login failed'}))
      }
    });
  }, []);

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
