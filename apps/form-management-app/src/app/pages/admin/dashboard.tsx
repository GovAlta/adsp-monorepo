import React from 'react';
import styled from 'styled-components';

const Dashboard = (): JSX.Element => {
  return (
    <AdminLayout>
      <Main>
        <h2>Welcome to Dashboard</h2>
        <a href="/autotest/edit/1-1-1-def">Basic form</a>
      </Main>
    </AdminLayout>
  );
}

export default Dashboard;



const Main = styled.div`
  flex: 1 1 auto;
  padding: var(--goa-space-l, 24px) 0;
`;


const AdminLayout = styled.div`
  display: flex;
`;
