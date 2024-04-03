import React from 'react';

import Container from '@components/Container';
import styled from 'styled-components';
import Header from '@components/AppHeader';
import { Outlet } from 'react-router-dom';

export function PublicApp(): JSX.Element {
  return (
    <PublicCss>
      <Header />
      <hr />
      <Container hs={4} vs={2}>
        <Outlet />
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
