import React, { ReactNode } from 'react';

import Container from '@components/Container';
import styled from 'styled-components';
import Header from '@components/AppHeader';

interface publicAppProps {
  children: ReactNode;
}
export function PublicApp({ children }: publicAppProps): JSX.Element {
  return (
    <PublicCss>
      <Header />
      <hr />
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

  hr {
    margin: 0;
  }
`;
