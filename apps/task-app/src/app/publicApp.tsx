import React from 'react';
import styled from 'styled-components';
import { Route, Routes, Navigate } from 'react-router-dom-6';

import Login from './pages/public/Login';

import { Landing } from './components/Landing';

export function PublicApp(): JSX.Element {
  return (
    <PublicCss>
      <Routes>
        <Route index element={<Navigate to="/overview" />} />
        <Route path="overview" element={<Landing />} />
        <Route path=":tenant/login" element={<Login />} />
      </Routes>
    </PublicCss>
  );
}

export default PublicApp;

const PublicCss = styled.div`
  hr {
    margin: 0;
  }
`;
