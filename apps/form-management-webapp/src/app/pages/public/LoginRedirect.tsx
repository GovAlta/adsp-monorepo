import React, { useEffect } from 'react';
import { Page } from '@components/Html';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { KeycloakCheckSSO } from '@store/tenant/actions';
import { useNavigate } from 'react-router-dom';
import { LOGIN_TYPES } from '@lib/keycloak';

interface LoginProps {
  location?: string;
}

const LoginRedirect = (props: LoginProps): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isTenantAdmin, tenantRealm, isAuthenticated } = useSelector((state: RootState) => ({
    isTenantAdmin: state.tenant.isTenantAdmin,
    tenantRealm: state.tenant.realm,
    isAuthenticated: state.session?.authenticated ?? false,
  }));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const urlParams = new URLSearchParams(window.location.search);
  const realm = encodeURIComponent(urlParams.get('realm'));

  useEffect(() => {
    dispatch(KeycloakCheckSSO(realm));
  }, [dispatch, realm]);

  useEffect(() => {
    const type = encodeURIComponent(urlParams.get('type'));
    const idpFromUrl = encodeURIComponent(urlParams.get('kc_idp_hint'));
    const skipSSO = window.location.href.includes('kc_idp_hint=');

    if (skipSSO) {
      localStorage.setItem('idpFromUrl', idpFromUrl);
    }

    if (type === LOGIN_TYPES.tenantAdmin) {
      if (isTenantAdmin) {
        const searchQuery = skipSSO ? (idpFromUrl ? `?kc_idp_hint=${idpFromUrl}` : '?kc_idp_hint=') : '';
        navigate(`/${tenantRealm}/login${searchQuery}`);
      }

      if (isTenantAdmin === false) {
        navigate('/login-error');
      }
    }

    if (type === LOGIN_TYPES.tenant) {
      if (isAuthenticated) {
        localStorage.setItem('realm', `${tenantRealm}`);
        navigate(`/admin?realm=${realm}`);
      }
    }

    if (type === LOGIN_TYPES.tenantCreationInit) {
      const searchQuery = skipSSO ? '?kc_idp_hint=' : '';
      navigate(`/tenant/creation${searchQuery}`, { state: { from: props.location } });
    }
  }, [navigate, tenantRealm, isTenantAdmin, isAuthenticated, props.location, urlParams, realm]);

  return <Page></Page>;
};

export default LoginRedirect;
