import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Route } from 'react-router-dom';

import Header from '@components/AppHeader';
import { HeaderCtx } from '@lib/headerContext';
import Container from '@components/Container';
import { KeycloakCheckSSOWithLogout, KeycloakRefreshToken } from '@store/tenant/actions';

export function PrivateApp({ children }) {
  const [title, setTitle] = useState<string>('');
  const dispatch = useDispatch();
  const urlParams = new URLSearchParams(window.location.search);
  const realm = urlParams.get('realm');

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
      <Header serviceName={title} />
      <Container>{children}</Container>
    </HeaderCtx.Provider>
  );
}

export function PrivateRoute({ component: Component, ...rest }) {
  return <Route {...rest} render={(props) => <Component {...props} />} />;
}

export default PrivateApp;
