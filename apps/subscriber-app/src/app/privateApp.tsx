import React, { ReactNode, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, useParams } from 'react-router-dom';
import Header from '@components/AppHeader';
import { HeaderCtx } from '@lib/headerContext';
import Container from '@components/Container';
import { RootState } from '@store/index';
import { KeycloakCheckSSOWithLogout, KeycloakRefreshToken } from '@store/tenant/actions';
import { GoAPageLoader } from '@abgov/react-components';
import { NotificationBanner } from './notificationBanner';
import { UpdateConfigRealm } from '@store/config/actions';

interface privateAppProps {
  children: ReactNode;
}
export function PrivateApp({ children }: privateAppProps): JSX.Element {
  const [title, setTitle] = useState<string>('Alberta Digital Service Platform - Subscription Management');
  const dispatch = useDispatch();
  const realm = useParams()['realm'];
  useEffect(() => {
    dispatch(UpdateConfigRealm(realm));
    setInterval(async () => {
      dispatch(KeycloakRefreshToken(realm));
    }, 120 * 1000);
    dispatch(KeycloakCheckSSOWithLogout(realm));
  }, []);

  return (
    <HeaderCtx.Provider value={{ setTitle }}>
      <Header serviceName={title} />
      <NotificationBanner />
      <Container>{children}</Container>
    </HeaderCtx.Provider>
  );
}

const PageLoader = (): JSX.Element => {
  return <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />;
};

// eslint-disable-next-line
export function PrivateRoute({ component: Component, ...rest }): JSX.Element {
  const userInfo = useSelector((state: RootState) => state.session?.userInfo);

  const ready = userInfo !== undefined;
  return <Route {...rest} render={(props) => (ready ? <Component {...props} /> : <PageLoader />)} />;
}

export default PrivateApp;
