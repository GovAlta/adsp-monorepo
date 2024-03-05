import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom-6';
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
  const realm = realmFromParams || localStorage.getItem('realm');

  if (realmFromParams) {
    localStorage.setItem('realm', realmFromParams);
  }
  useEffect(() => {
    dispatch(KeycloakCheckSSOWithLogout(realm));
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  const userInfo = useSelector((state: RootState) => state.session?.userInfo);
  const ready = !!userInfo;

  return (
    <>
      {!ready && <CenterWidthPageLoader />}
      {ready && (
        <HeaderCtx.Provider value={{ setTitle }}>
          <ScrollBarFixTop>
            <FixedContainer>
              <Header serviceName={title} admin={true} />
              {/*
      NOTE: we might need to add the following function in the near feature
      */}
              {/* <IdleTimer
        checkInterval={10}
        timeoutFn={() => {
          dispatch(TenantLogout());
        }}
        continueFn={() => {
          location.reload();
        }}
      /> */}

              <NotificationBanner />
              <LogoutModal />
            </FixedContainer>
          </ScrollBarFixTop>
          <ScrollBarFixMain notifications={notifications}>
            <Container>
              <Outlet />
            </Container>
          </ScrollBarFixMain>
        </HeaderCtx.Provider>
      )}
    </>
  );
}

export default PrivateApp;

const FixedContainer = styled.div`
  position: fixed;
  width: 100%;
  z-index: 1;
`;
const ScrollBarFixTop = styled.div`
  margin-right: calc(100% - 100vw);
`;

interface ItemProps {
  //eslint-disable-next-line
  notifications: any[];
}
const ScrollBarFixMain = styled.div`
  margin-left: calc(100vw - 100%);
  margin-right: 0;
  padding-top: ${(props: ItemProps) => (props.notifications.length >= 1 ? '12rem' : '7rem')};
`;
