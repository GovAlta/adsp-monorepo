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
  const { authenticated, tenantName } = useSelector((state: RootState) => ({
    authenticated: state.session.authenticated,
    tenantName: state.tenant.name,
  }));
  const dispatch = useDispatch();
  const history = useHistory();
  useEffect(() => {
    if (authenticated || tenantName !== '') {
      dispatch(TenantLogout());
      dispatch(ConfigLogout());
      dispatch(SessionLogout());
    } else {
      history.push('/');
    }
  }, [authenticated, tenantName]);

  return <div></div>;
};

export default LogoutRedirect;
