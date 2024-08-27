import React from 'react';
import styled from 'styled-components';
import GoaLogo from '../assets/goa-logo.svg';
import { Footer, Recaptcha } from '@core-services/app-common';
import { NotificationBanner } from './notificationBanner';
import Header from '@components/AppHeader';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, Navigate } from 'react-router-dom';
import PublicSubscriptions from '@pages/public/Subscriptions';
import Login from '@pages/public/Login';
import LogoutRedirect from '@pages/public/LogoutRedirect';
import LandingPage from '@pages/public/Landing';
import { recaptchaScriptLoaded } from '@store/config/actions';

export function PublicApp(): JSX.Element {
  const recaptchaKey = useSelector((state: RootState) => state.config?.recaptchaKey);
  const dispatch = useDispatch();

  return (
    <PublicCss>
      <Header serviceName="Alberta Digital Service Platform - Subscription management" />
      <NotificationBanner loggedIn={false} />
      <Routes>
        <Route index element={<Navigate to="/overview" />} />
        <Route path="overview" element={<LandingPage />} />
        <Route path="logout-redirect" element={<LogoutRedirect />} />
        <Route path=":realm/login" element={<Login />} />
        <Route path=":subscriberId" element={<PublicSubscriptions />} />
      </Routes>
      <Footer logoSrc={GoaLogo} />
      {recaptchaKey && <Recaptcha siteKey={recaptchaKey} onLoad={() => dispatch(recaptchaScriptLoaded())} />}
    </PublicCss>
  );
}

export default PublicApp;

const PublicCss = styled.div`
  hr {
    margin: 0;
  }
`;
