import React, { useEffect } from 'react';
import { Session } from '../../store/session/models';

import { useSelector, useDispatch } from 'react-redux';
import { SessionLoginSuccess, SessionLogout } from '../../store/session/actions';
import { UpdateConfigRealm } from '../../store/config/actions';

import { useParams } from 'react-router-dom';
import { RootState } from '../../store';
import { login, logout } from '../../services/session';
import Header from '../../header';
import { ErrorNotification } from '../../store/notifications/actions';
import { useHistory } from 'react-router-dom';

interface TennatTypes {
  tenantName: string;
}

function TenantLogin() {
  const history = useHistory();

  const { keycloakConfig } = useSelector((state: RootState) => ({
    keycloakConfig: state.config?.keycloakApi,
  }));
  const dispatch = useDispatch();

  const { tenantName } = useParams<TennatTypes>();

  useEffect(() => {
    const onSuccess = (session: Session) => {
      dispatch(SessionLoginSuccess(session));
      dispatch(UpdateConfigRealm(tenantName));
      history.push('/tenant-admin');
    };
    const onError = (err: string) => {
      dispatch(ErrorNotification({ message: err }));
    };

    const tenantConfig = keycloakConfig;
    // TODO: fetch the tenantName-realm mapping
    tenantConfig.realm = tenantName;
    tenantConfig.realm = tenantName;
    login(tenantConfig, onSuccess, onError, true);
  }, [dispatch, keycloakConfig, tenantName]);

  return (
    <div>
      <Header isLoginLink={false} />
    </div>
  );
}

export default TenantLogin;
