import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Container from '@components/Container';
import ActivateErrorPage from './ActivateErrorPage';
import AddClientRole from './AddClientRole';
import CreateErrorPage from './CreateErrorPage';
import CreatingTenant from './CreatingTenant';
import Tenants from './Tenants';

export function TenantsRouter(): JSX.Element {
  return (
    <Container hs={1} vs={2}>
      <Routes>
        <Route path="/admin/tenants" element={<Tenants />} />
        <Route path="/admin/tenants/creating" element={<CreatingTenant />} />
        <Route path="/admin/tenants/add-role" element={<AddClientRole />} />
        <Route path="/admin/tenants/creation-error" element={<CreateErrorPage />} />
        <Route path="/admin/tenants/activation-error" element={<ActivateErrorPage />} />
      </Routes>
    </Container>
  );
}
