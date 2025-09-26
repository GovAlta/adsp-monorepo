import React, {useEffect} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppState, getAccessToken, renewSession, loadExtensions } from '../../state';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { FormEditorCommon } from '@form-editor-common';
import { AppDispatch } from '../../state';

const TenantManagement = (): JSX.Element => {
    const dispatch = useDispatch<AppDispatch>();
    const { state } = useSelector((state: AppState) => ({
      state: state
    }));
    console.log(JSON.stringify(state) + "<STate")
      const { tenant: tenantName } = useParams<{ tenant: string }>();

  useEffect(() => {
    getAccessToken();
 dispatch(loadExtensions(tenantName));
  }, [state]);

  return (
    <AdminLayout>
      <Main>
        <h2>Welcome to Dashboard</h2>
        <FormEditorCommon
          session={state}
          config={{
            tabs: {
              overview: true,
              definition: {
                enabled: true,
                features: {
                  filterByTag: true,
                  filterByProgram: true,
                  filterByMinistry: true,
                  registeredID: true,
                  searchActsOfLegislation: true,
                },
              },
              export: true,
            },
          }}
        />
      </Main>
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
