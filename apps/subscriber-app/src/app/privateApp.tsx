import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import Header from '@components/AppHeader';
import { HeaderCtx } from '@lib/headerContext';
import { Route, Routes } from 'react-router-dom';
import { KeycloakRefreshToken } from '@store/tenant/actions';
import { NotificationBanner } from './notificationBanner';
import { UpdateConfigRealm } from '@store/config/actions';
import GoaLogo from '../assets/goa-logo.svg';
import { Footer } from '@core-services/app-common';
import Subscriptions from '@pages/private/Subscriptions/Subscriptions';
import SmsRedirect from '@pages/private/Subscriptions/SmsRedirect';

export function PrivateApp(): JSX.Element {
  const [title, setTitle] = useState<string>('Alberta Digital Service Platform - Subscription management');
  const dispatch = useDispatch();
  const { realm } = useParams();

  useEffect(() => {
    dispatch(UpdateConfigRealm(realm));
    setInterval(async () => {
      dispatch(KeycloakRefreshToken(realm));
    }, 120 * 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HeaderCtx.Provider value={{ setTitle }}>
      <Header serviceName={title} />
      <NotificationBanner loggedIn={true} />
      <Routes>
        <Route path="sms/:code" element={<SmsRedirect />} />
        <Route path="/*" element={<Subscriptions realm={realm} />} />
      </Routes>
      <Footer logoSrc={GoaLogo} />
    </HeaderCtx.Provider>
  );
}

export default PrivateApp;
