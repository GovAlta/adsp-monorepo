import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Header from '@components/AppHeader';
import { HeaderCtx } from '@lib/headerContext';
import Container from '@components/Container';
import { RootState } from '@store/index';
import { KeycloakCheckSSOWithLogout } from '@store/tenant/actions';
import { NotificationBanner } from './notificationBanner';
import styled from 'styled-components';
import { LogoutModal } from '@components/LogoutModal';
import { useTokenExpiryCount, useTokenWillExpiryCount } from '@lib/useTokenExpiryCount';
import { CenterWidthPageLoader } from '@core-services/app-common';

export function PrivateApp(): JSX.Element {
  const [title, setTitle] = useState<string>('');
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notifications.notifications);

  useTokenExpiryCount();
  useTokenWillExpiryCount();

  const urlParams = new URLSearchParams(window.location.search);
  const realmFromParams = urlParams.get('realm');
  const isHeadlessPage = urlParams.get('headless') === 'true';
  const realm = realmFromParams || localStorage.getItem('realm');

  if (realmFromParams) {
    localStorage.setItem('realm', realmFromParams);
  }
  useEffect(() => {
    dispatch(KeycloakCheckSSOWithLogout(realm));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const userInfo = useSelector((state: RootState) => state.session?.userInfo);
  const ready = !!userInfo;

  return (
    <>
      {!ready && <CenterWidthPageLoader />}
      {ready && (
        <HeaderCtx.Provider value={{ setTitle }}>
          {isHeadlessPage !== true && (
            <>
              <ScrollBarFixTop>
                <FixedContainer>
                  <Header serviceName={title} admin={true} />
                  <NotificationBanner />
                  <LogoutModal />
                </FixedContainer>
              </ScrollBarFixTop>
              <ScrollBarFixMain notifications={notifications}>
                <Container>
                  <Outlet />
                </Container>
              </ScrollBarFixMain>
            </>
          )}
          {isHeadlessPage === true && (
            <>
              <NotificationBanner />
              <Container>
                <Outlet />
              </Container>
              <LogoutModal />
            </>
          )}
        </HeaderCtx.Provider>
      )}
    </>
  );
}

export default PrivateApp;

const FixedContainer = styled.div`
  position: fixed;
  width: 100%;
  z-index: 100;
`;
const ScrollBarFixTop = styled.div`
  margin-right: calc(100% - 100vw);
`;

interface ItemProps {
  //eslint-disable-next-line
  notifications: any[];
}
const ScrollBarFixMain = styled.div<ItemProps>`
  margin-left: calc(100vw - 100%);
  margin-right: 0;
  padding-top: ${(props) => (props.notifications.length >= 1 ? '12rem' : '99px')};
`;
