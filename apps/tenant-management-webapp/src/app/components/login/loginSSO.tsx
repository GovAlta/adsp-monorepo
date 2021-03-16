import React, { useEffect } from 'react';
import Header from '../../header';
import { useSelector, useDispatch } from 'react-redux';
import { FetchTenant } from '../../store/tenant/actions';
import { Redirect } from 'react-router-dom';
import { RootState } from '../../store';
import { ErrorNotification } from '../../store/notifications/actions';
import { login, isAuthenticated } from '../../services/session';
import { CredentialRefresh, SessionLoginSuccess } from '../../store/session/actions';
import { Session } from '../../store/session/models';

function LoginSSO() {
  const dispatch = useDispatch();
  const tenantName = useSelector((state: RootState) => state.tenant.name);
  const { keycloakConfig } = useSelector((state: RootState) => ({
    keycloakConfig: state.config?.keycloakApi,
  }));

  // login
  useEffect(() => {
    const onSuccess = (session: Session) => {
      dispatch(CredentialRefresh(session.credentials));
      dispatch(SessionLoginSuccess(session));
      dispatch(FetchTenant(session.realm));
    };
    const onError = (err: string) => {
      dispatch(ErrorNotification({ message: err }));
    };

    login(keycloakConfig, onSuccess, onError)

  }, [dispatch, keycloakConfig]);

  if (isAuthenticated()) {
    if (tenantName === null) {
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
