import React, { useContext, useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { HeaderCtx } from '@lib/headerContext';
import { keycloak } from '@lib/session';
import { CredentialRefresh } from '@store/session/actions';

import Sidebar from './sidebar';
import Dashboard from './dashboard';
import Adminstration from './administration';
import File from './services/file';
import AccessPage from './services/access/access';
import Container from '@components/_/Container';

const TenantManagement = () => {
  const { setTitle } = useContext(HeaderCtx);
  const dispatch = useDispatch();

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant Management');
  }, [setTitle]);

  useEffect(() => {
    setInterval(async () => {
      try {
        const expiringSoon = await keycloak.updateToken(60);
        if (expiringSoon) {
          dispatch(
            CredentialRefresh({
              token: keycloak.token,
              tokenExp: keycloak.tokenParsed.exp,
            })
          );
        }
      } catch (e) {
        console.log(e);
      }
    }, 20000);
  }, [dispatch]);

  return (
    <AdminLayout>
      <SidebarWrapper>
        <Sidebar type="desktop" />
      </SidebarWrapper>
      <Container hs={1}>
        <Switch>
          <Route exact path="/tenant-admin/">
            <Dashboard />
          </Route>
          <Route exact path="/tenant-admin/admin">
            <Adminstration />
          </Route>
          <Route path="/tenant-admin/access">
            <AccessPage />
          </Route>
          <Route exact path="/tenant-admin/admin">
            <Adminstration />
          </Route>
          <Route exact path="/tenant-admin/services/file">
            <File />
          </Route>
        </Switch>
      </Container>
    </AdminLayout>
  );
};

export default TenantManagement;

const AdminLayout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const SidebarWrapper = styled.nav`
  flex: 0 0 0;
  transition: flex-basis 200ms;
  overflow-x: hidden;
  margin-top: 0.5rem;

  @media (min-width: 768px) {
    flex-basis: 12rem;
  }
`;
