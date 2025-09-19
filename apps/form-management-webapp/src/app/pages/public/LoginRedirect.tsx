/* eslint-disable */
import React, { useEffect } from 'react';
import { Page } from '@components/Html';
import { RootState, setSession } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LOGIN_TYPES, getOrCreateKeycloakAuth } from '@lib/keycloak';

interface LoginProps {
  location?: string;
}

const LoginRedirect = (props: LoginProps): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { tenantRealm, isAuthenticated, keycloak } = useSelector((state: RootState) => ({
    tenantRealm: state.session.realm,
    isAuthenticated: state.session?.authenticated ?? false,
    keycloak: state.config?.keycloakApi,
  }));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const urlParams = new URLSearchParams(window.location.search);
  const realm = decodeURIComponent(urlParams.get('realm')) || 'core';
  const type = decodeURIComponent(urlParams.get('type')) || LOGIN_TYPES.tenant;
  const idp = decodeURIComponent(urlParams.get('kc_idp_hint'));

  useEffect(() => {
    (async () => {
      if (!keycloak?.url || !keycloak?.clientId) return;
      const auth = await getOrCreateKeycloakAuth({ url: keycloak.url, clientId: keycloak.clientId } as any, realm);
      const session = await auth.checkSSO();
      if (session?.authenticated) {
        dispatch(setSession(session));
        // Route decisions based on previous logic
        if (type === LOGIN_TYPES.tenant) {
          const skipSSO = urlParams.get('skipSSO') === 'true';
          const searchQuery = skipSSO ? '?kc_idp_hint=' : '';
          navigate(`/admin${searchQuery}`);
        } else if (type === LOGIN_TYPES.tenantAdmin) {
          navigate(`/admin?realm=${realm}`);
        } else {
          navigate(`/admin`);
        }
      } else {
        navigate('/login');
      }
    })();
  }, [navigate, dispatch, urlParams, realm, type, keycloak]);

  return <Page></Page>;
};

export default LoginRedirect;
