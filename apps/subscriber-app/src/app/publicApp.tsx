import React, { ReactNode } from 'react';
import styled from 'styled-components';
import GoaLogo from '../assets/goa-logo.svg';
import Footer from '@components/Footer';
import Header from '@components/AppHeader';

interface publicAppProps {
  children: ReactNode;
}
export function PublicApp({ children }: publicAppProps): JSX.Element {
  return (
    <PublicCss>
      <Header serviceName="Alberta Digital Service Platform - Subscription management" />
      {children}
      <Footer logoSrc={GoaLogo} />
    </PublicCss>
  );
}

export default PublicApp;

const PublicCss = styled.div`
  hr {
    margin: 0;
  }
`;
