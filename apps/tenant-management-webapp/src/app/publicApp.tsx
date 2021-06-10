import React from 'react';

import Container from '@components/Container';
import { GoAHeader } from '@abgov/react-components';
import styled from 'styled-components';

export function PublicApp({ children }) {
  return (
    <PublicCss>
      <GoAHeader serviceHome="/" serviceLevel="alpha" serviceName="" />
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
