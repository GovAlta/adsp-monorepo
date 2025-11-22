import React from 'react';
import styled from 'styled-components';
import { NameDescriptionDataSchema, EditorPadding } from './styled-components';

export const UIEditorContainer = (): JSX.Element => {
  return (
    <AdminLayout>
      <Main>
        <h2>Welcome to Ui Container</h2>
    
     
      </Main>
    </AdminLayout>
  );
};

const Main = styled.div`
  flex: 1 1 auto;
  padding: var(--goa-space-l, 24px) 0;
`;

const AdminLayout = styled.div`
  display: flex;
`;
