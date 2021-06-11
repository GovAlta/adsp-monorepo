import React, { useEffect } from 'react';
import { Page } from '@components/Html';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { KeycloakCheckSSO } from '@store/tenant/actions';
import { useHistory } from 'react-router-dom';
import { LOGIN_TYPES } from '@lib/keycloak';

const LoginRedirect = (props) => {
  const dispatch = useDispatch();
  const history = useHistory();

  const { isTenantAdmin, tenantRealm } = useSelector((state: RootState) => ({
    isTenantAdmin: state.tenant.isTenantAdmin,
    tenantRealm: state.tenant.realm,
  }));

  // TODO: isAuthenticated shall be same as the validation in the PrivateApp. Need to create a global function for both.
  const isAuthenticated = useSelector((state: RootState) => state.session?.authenticated ?? false);
  const urlParams = new URLSearchParams(window.location.search);
  const realm = urlParams.get('realm');
  useEffect(() => {
    dispatch(KeycloakCheckSSO(realm));
  }, [isTenantAdmin, isAuthenticated]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');

    if (type === LOGIN_TYPES.tenantAdmin) {
      if (isTenantAdmin) {
        history.push({
          pathname: `/${tenantRealm}/autologin`,
        });
      }
    }

    if (type === LOGIN_TYPES.tenant) {
      if (isAuthenticated) {
        history.push({
          pathname: '/admin/tenant-admin',
          search: `?realm=${realm}`,
          state: { from: props.location },
        });
      }
    }

    if (type === LOGIN_TYPES.tenantCreationInit) {
      // TODO: state check for navigation
      history.push({
        pathname: '/get-started',
        state: { from: props.location },
      });
    }
  }, [tenantRealm, isTenantAdmin, isAuthenticated]);

  return <Page></Page>;
};

export default LoginRedirect;
