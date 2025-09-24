/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '@components/AppHeader';
import Container from '@components/Container';
import { RootState, setSession } from '@store/index';
import styled from 'styled-components';
import { getOrCreateKeycloakAuth } from '@lib/keycloak';

export function PrivateApp(): JSX.Element {
  const [title] = useState<string>('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);

  const urlParams = new URLSearchParams(window.location.search);
  const realmFromParams = urlParams.get('realm');
  const isHeadlessPage = urlParams.get('headless') === 'true';
  const realm = realmFromParams || localStorage.getItem('realm') || 'core';

  if (realmFromParams) {
    localStorage.setItem('realm', realmFromParams);
  }

  useEffect(() => {
    (async () => {
      if (!keycloakConfig?.url || !keycloakConfig?.clientId) return;
      const auth = await getOrCreateKeycloakAuth(
        { url: keycloakConfig.url, clientId: keycloakConfig.clientId } as any,
        realm
      );
      const session = await auth.checkSSO();
      if (session?.authenticated) {
        dispatch(setSession(session));
      } else {
        navigate('/login');
      }
    })();
  }, [dispatch, realm, keycloakConfig, navigate]);

  const notifications: any[] = [];

  return (
    <>
      <ScrollBarFixTop />
      <Header />
      <Main isHeadless={isHeadlessPage} aria-hidden={isHeadlessPage} aria-label="main content">
        <Container>
          <MainContent>{isHeadlessPage ? null : <Outlet />}</MainContent>
        </Container>
      </Main>
    </>
  );
}

export default PrivateApp;

const Main = styled.main<{ isHeadless: boolean }>`
  min-height: ${(props) => (props.isHeadless ? 'auto' : 'calc(100vh - 99px)')};
`;

const MainContent = styled.div`
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  min-height: calc(100vh - 99px);
`;

const ScrollBarFixTop = styled.div`
  margin-right: calc(100% - 100vw);
`;
