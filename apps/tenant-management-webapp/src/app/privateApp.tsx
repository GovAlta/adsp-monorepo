import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route } from 'react-router-dom';
import Header from '@components/AppHeader';
import { HeaderCtx } from '@lib/headerContext';
import Container from '@components/Container';
import { RootState } from '@store/index';
import { KeycloakCheckSSOWithLogout, KeycloakRefreshToken } from '@store/tenant/actions';
import { GoAPageLoader } from '@abgov/react-components';
import { TenantLogout } from '@store/tenant/actions';

import { IdleTimer } from '@components/IdleTimer';

export function PrivateApp({ children }) {
  const [title, setTitle] = useState<string>('');
  const dispatch = useDispatch();
  const urlParams = new URLSearchParams(window.location.search);
  const realm = urlParams.get('realm') || localStorage.getItem('realm');

  useEffect(() => {
    setInterval(async () => {
      dispatch(KeycloakRefreshToken());
    }, 60 * 1000);
    dispatch(KeycloakCheckSSOWithLogout(realm));
  }, []);

  return (
    <HeaderCtx.Provider value={{ setTitle }}>
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
      <Container>{children}</Container>
    </HeaderCtx.Provider>
  );
}

const PageLoader = () => {
  return <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />;
};

export function PrivateRoute({ component: Component, ...rest }) {
  const userInfo = useSelector((state: RootState) => state.session?.userInfo);
  const tenantRealm = useSelector((state: RootState) => state.tenant?.realm);
  const ready = userInfo !== undefined && tenantRealm === '';

  return <Route {...rest} render={(props) => (ready ? <Component {...props} /> : <PageLoader />)} />;
}

export default PrivateApp;
