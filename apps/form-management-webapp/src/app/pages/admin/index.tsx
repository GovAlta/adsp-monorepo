import React from 'react';
import styled from 'styled-components';
import Container from '@components/Container';

const TenantManagement = (): JSX.Element => {
  return (
    <AdminLayout>
      <Container>
        <Main>
          <h2>Welcome to Dashboard</h2>
        </Main>
      </Container>
    </AdminLayout>
  );
};

export default TenantManagement;

const AdminLayout = styled.div`
  display: flex;
`;

const Main = styled.div`
  flex: 1 1 auto;
  padding: var(--goa-space-l, 24px) 0;
`;