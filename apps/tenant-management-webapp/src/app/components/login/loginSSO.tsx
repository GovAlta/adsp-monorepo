import React, { useEffect } from 'react';
import Header from '../../header';
import { useSelector, useDispatch } from 'react-redux';
import { IsTenantAdmin } from '../../store/tenant/actions';
import { Redirect } from 'react-router-dom';
import { RootState } from '../../store';
import { ErrorNotification } from '../../store/notifications/actions';
import { login, isAuthenticated } from '../../services/session';
import { CredentialRefresh, SessionLoginSuccess } from '../../store/session/actions';
import { Session } from '../../store/session/models';
import Keycloak from 'keycloak-js';
import { SessionLogout } from '../../store/session/actions';

function LoginSSO() {
  const dispatch = useDispatch();
  const isAdmin = useSelector((state: RootState) => state.tenant.isTenantAdmin);
  const { keycloakConfig } = useSelector((state: RootState) => ({
    keycloakConfig: state.config?.keycloakApi,
  }));
  const realm = useSelector((state: RootState) => state.session.realm);

  // login
  useEffect(() => {
    const onSuccess = (session: Session) => {
      dispatch(CredentialRefresh(session.credentials));
      dispatch(SessionLoginSuccess(session));
      dispatch(IsTenantAdmin(session.userInfo.email));
    };
    const onError = (err: string) => {
      dispatch(ErrorNotification({ message: err }));
    };

    login(keycloakConfig, onSuccess, onError);
  }, [dispatch, keycloakConfig]);

  if (isAuthenticated()) {
    // The isAdmin can be null, but this is not expected.
    if (isAdmin === false) {
      return <Redirect to="/Realms/CreateRealm" />;
    }
    if (isAdmin === true) {
      const keycloak = Keycloak(keycloakConfig);
      // Logout from the core realm to switch to the tenant realm
      keycloak.init({ onLoad: 'check-sso' }).then(() => {
        dispatch(SessionLogout());

        keycloak.logout().then(() => {
          const tenantLoginUrl = `/${realm}/login`;
          return <Redirect to={tenantLoginUrl} />;
        });
      });
    }
  }

  return (
    <div>
      <Header isLoginLink={false} />
    </div>
  );
}

export default LoginSSO;
