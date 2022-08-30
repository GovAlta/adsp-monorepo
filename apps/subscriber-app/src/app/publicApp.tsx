import React, { ReactNode } from 'react';
import styled from 'styled-components';
import GoaLogo from '../assets/goa-logo.svg';
import Footer from '@components/Footer';
import { NotificationBanner } from './notificationBanner';
import Header from '@components/AppHeader';
import Recaptcha from './components/Recaptcha';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

interface publicAppProps {
  children: ReactNode;
}
export const PublicApp: React.FC<publicAppProps> = ({ children }: publicAppProps): JSX.Element => {
  const recaptchaKey = useSelector((state: RootState) => state.config?.recaptchaKey);

  return (
    <PublicCss>
      <Header serviceName="Alberta Digital Service Platform - Subscription management" />
      <NotificationBanner />
      {children}
      <Footer logoSrc={GoaLogo} />
      {recaptchaKey && <Recaptcha siteKey={recaptchaKey} />}
    </PublicCss>
  );
};

export default PublicApp;

const PublicCss = styled.div`
  hr {
    margin: 0;
  }
`;
