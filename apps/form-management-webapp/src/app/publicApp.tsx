import React from 'react';
import Container from '@components/Container';
import styled from 'styled-components';
import Header from '@components/AppHeader';
import { Outlet } from 'react-router-dom';

export default function PublicApp(): JSX.Element {
  return (
    <PublicCss>
      <Header />
      <hr />
      <Container>
        <Outlet />
      </Container>
    </PublicCss>
  );
}

const PublicCss = styled.div`
  h1 { font-weight: var(--fw-bold); }
  hr { margin: 0; }
`;