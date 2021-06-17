import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route } from 'react-router-dom';
import Header from '@components/AppHeader';
import { HeaderCtx } from '@lib/headerContext';
import Container from '@components/Container';
import { RootState } from '@store/index';
import { KeycloakCheckSSOWithLogout, KeycloakRefreshToken } from '@store/tenant/actions';

export function PrivateApp({ children }) {
  const [title, setTitle] = useState<string>('');
  const dispatch = useDispatch();
  const urlParams = new URLSearchParams(window.location.search);
  const realm = urlParams.get('realm') || localStorage.getItem('realm');

  useEffect(() => {
    dispatch(KeycloakCheckSSOWithLogout(realm));
  }, []);

  useEffect(() => {
    setInterval(async () => {
      dispatch(KeycloakRefreshToken());
    }, 25000);
  }, [dispatch]);

  return (
    <HeaderCtx.Provider value={{ setTitle }}>
      <Header serviceName={title} admin={true} />
      <Container>{children}</Container>
    </HeaderCtx.Provider>
  );
}

export function PrivateRoute({ component: Component, ...rest }) {
  const userInfo = useSelector((state: RootState) => state.session?.userInfo);
  const tenantRealm = useSelector((state: RootState) => state.tenant?.realm);
  const ready = userInfo !== undefined && tenantRealm === '';
  return <Route {...rest} render={(props) => ready && <Component {...props} />} />;
}

export default PrivateApp;
