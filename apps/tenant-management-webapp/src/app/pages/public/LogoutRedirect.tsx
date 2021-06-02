import React, { useEffect } from 'react';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { TenantLogout } from '@store/tenant/actions';
import { ConfigLogout } from '@store/config/actions';
import { SessionLogout } from '@store/session/actions';

const LogoutRedirect = () => {
  /**
   * Validate logout using authenticated and authenticated.
   * Even we invoke the ConfigLogout. But, it is a constant - hard for testing.
   * */
  const { authenticated, tenantRealm } = useSelector((state: RootState) => ({
    authenticated: state.session.authenticated,
    tenantRealm: state.tenant.realm,
  }));
  const dispatch = useDispatch();
  const history = useHistory();
  useEffect(() => {
    if (authenticated || tenantRealm !== '') {
      dispatch(TenantLogout());
      dispatch(ConfigLogout());
      dispatch(SessionLogout());
    } else {
      history.push('/');
    }
  }, [authenticated, tenantRealm]);

  return <div></div>;
};

export default LogoutRedirect;
