import React, { ReactNode } from 'react';

import Container from '@components/Container';
import { GoAHeader } from '@abgov/react-components';
import styled from 'styled-components';
interface publicAppProps {
  children: ReactNode;
}
export function PublicApp({ children }: publicAppProps): JSX.Element {
  return (
    <PublicCss>
      <GoAHeader serviceHome="/" serviceLevel="beta" serviceName="" />
      <Container hs={4} vs={2}>
        {children}
      </Container>
    </PublicCss>
  );
}

export default PublicApp;

const PublicCss = styled.div`
  h1 {
    font-weight: var(--fw-bold);
  }
`;
