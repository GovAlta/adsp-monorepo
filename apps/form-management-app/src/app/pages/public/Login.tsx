/* eslint-disable */
import React, { useEffect } from 'react';
import { Page } from '@components/Html';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getOrCreateKeycloakAuth, getIdpHint, LOGIN_TYPES } from '@lib/keycloak';
import { useLocation } from 'react-router-dom';

const LoginLanding = (): JSX.Element => {
  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);
  const location = useLocation();

  async function handleSignIn() {
    if (!keycloakConfig?.url || !keycloakConfig?.clientId) return;
    const realm = keycloakConfig?.realm || localStorage.getItem('realm') || 'core';
    const auth = await getOrCreateKeycloakAuth(
      { url: keycloakConfig.url, clientId: keycloakConfig.clientId } as any,
      realm
    );
    const idpHint = getIdpHint();
    await auth.loginByCore(LOGIN_TYPES.tenant, idpHint);
  }

  // Auto-trigger only if ?kc_idp_hint is present (even if empty)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('kc_idp_hint')) {
      handleSignIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return (
    <Page>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--goa-space-2xl, 48px)' }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <h2 style={{ marginBottom: 'var(--goa-space-l, 24px)' }}>DCM Group</h2>
          <p style={{ marginBottom: 'var(--goa-space-l, 24px)' }}>
            Continue to the dashboard using your Government of Alberta credentials.
          </p>
        </div>
      </div>
    </Page>
  );
};

export default LoginLanding;
