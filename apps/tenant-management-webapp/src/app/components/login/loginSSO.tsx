import React, { useEffect } from 'react';
import Header from '../../header';
import { useSelector, useDispatch } from 'react-redux';
import { FetchTenantSuccess, FetchTenant } from '../../store/tenant/actions';
import { Redirect } from 'react-router-dom';
import { RootState } from '../../store';
import { ErrorNotification } from '../../store/notifications/actions';
import { login, isAuthenticated } from '../../services/session';
import { SessionLoginSuccess } from '../../store/session/actions';
import { Session } from '../../store/session/models';

function LoginSSO() {
  const dispatch = useDispatch();
  const tenantName = useSelector((state: RootState) => state.tenant.name);
  const { keycloakConfig } = useSelector((state: RootState) => ({
    keycloakConfig: state.config?.keycloakApi,
  }));

  // login
  useEffect(() => {
    login(keycloakConfig,
      (session: Session) => {
        dispatch(SessionLoginSuccess(session));
        dispatch(FetchTenant(session.realm));
        dispatch(FetchTenantSuccess({ name: session.realm }));  // TODO: what is this for?
      },
      (err: string) => {
        dispatch(ErrorNotification({ message: err }));
      }
    )
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
