import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { HeaderCtx } from '@lib/headerContext';

import Container from '@components/Container';
import { FormRouter } from './services/form';

const TenantManagement = (): JSX.Element => {
  const { setTitle } = useContext(HeaderCtx);

  const config = useSelector((state: RootState) => state.config);

  useEffect(() => {
    setTitle('DCM Group - Form management');
    const feedback = globalThis['adspFeedback'];
    if (config.feedback && feedback) {
      feedback.initialize({ tenant: config.feedback.tenant, name: 'adsp', email: 'adsp@gov.ab.ca' });
    }
  }, [setTitle, config]);

  return (
    <AdminLayout>
      <Container hs={1}>
        <Routes>
          <Route index element={<FormRouter />} />
        </Routes>
        <Outlet />
      </Container>
    </AdminLayout>
  );
};

export default TenantManagement;

const AdminLayout = styled.div`
  display: flex;
`;
