import React, { ReactNode } from 'react';

import Container from '@components/Container';
import { GoAHeader } from '@abgov/react-components';
import styled from 'styled-components';
import GoaLogo from '../assets/goa-logo.svg';
import Footer from '@components/Footer';

interface publicAppProps {
  children: ReactNode;
}
export function PublicApp({ children }: publicAppProps): JSX.Element {
  return (
    <PublicCss>
      <GoAHeader serviceHome="/" serviceLevel="beta" serviceName="" />
      <hr />
      <Container hs={4} vs={2}>
        {children}
      </Container>
      <Footer logoSrc={GoaLogo} />
    </PublicCss>
  );
}

export default PublicApp;

const PublicCss = styled.div`
  h1 {
    font-weight: var(--fw-bold);
  }

  hr {
    margin: 0;
  }
`;
