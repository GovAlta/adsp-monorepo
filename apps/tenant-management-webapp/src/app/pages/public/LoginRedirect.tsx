import React, { useEffect } from 'react';
import { Page } from '@components/Html';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { KeycloakCheckSSO } from '@store/tenant/actions';
import { useHistory } from 'react-router-dom';
import { LOGIN_TYPES } from '@lib/keycloak';
interface LoginProps {
  location?: string;
}
const LoginRedirect = (props: LoginProps): JSX.Element => {
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
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const idpFromUrl = urlParams.get('kc_idp_hint');
    const location: string = window.location.href;
    const skipSSO = location.indexOf('kc_idp_hint') > -1;

    if (type === LOGIN_TYPES.tenantAdmin) {
      if (isTenantAdmin) {
        if (skipSSO && !idpFromUrl) {
          history.push({
            pathname: `/${tenantRealm}/autologin`,
            search: `?kc_idp_hint=`,
          });
        } else if (idpFromUrl) {
          history.push({
            pathname: `/${tenantRealm}/autologin`,
            search: `?kc_idp_hint=${idpFromUrl}`,
          });
        } else {
          history.push({
            pathname: `/${tenantRealm}/autologin`,
          });
        }
      }

      if (isTenantAdmin === false) {
        // non-admin user login through tenantAdmin
        history.push({
          pathname: `/login-error`,
        });
      }
    }

    if (type === LOGIN_TYPES.tenant) {
      if (isAuthenticated) {
        localStorage.setItem('realm', `${tenantRealm}`);

        history.push({
          pathname: '/admin',
          search: `?realm=${realm}`,
          state: { from: props.location },
        });
      }
    }

    if (type === LOGIN_TYPES.tenantCreationInit) {
      // TODO: state check for navigation

      let search = '';
      if (skipSSO) {
        search = '?kc_idp_hint=';
      }
      history.push({
        pathname: '/tenant/creation',
        search: search,
        state: { from: props.location },
      });
    }
  }, [tenantRealm, isTenantAdmin]);

  return <Page></Page>;
};

export default LoginRedirect;
