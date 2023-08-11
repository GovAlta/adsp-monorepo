import React, { useContext, useEffect } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';
import { HeaderCtx } from '@lib/headerContext';

import Sidebar from './sidebar';
import Dashboard from './dashboard';
import { File } from './services/file';

import AccessPage from './services/access/access';
import { Directory } from './services/directory';
import Container from '@components/Container';
import Status from './services/status';
import { EventLog } from './event-log';
import { ServiceMetrics } from './service-metrics';
import { Events } from './services/events';
import { Notifications } from './services/notifications';
import { Configuration } from './services/configuration';
import { Calendar } from './services/calendar';
import { PDFRouter } from './services/pdf';
import { FormRouter } from './services/form';

import { Script } from './services/script';

const TenantManagement = (): JSX.Element => {
  const { setTitle } = useContext(HeaderCtx);

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant management');
  }, [setTitle]);

  return (
    <AdminLayout>
      <SidebarWrapper>
        <Sidebar type="desktop" />
      </SidebarWrapper>
      <Container hs={1}>
        <Switch>
          <Route exact path="/admin">
            <Dashboard />
          </Route>
          <Route exact path="/admin/event-log">
            <EventLog />
          </Route>
          <Route exact path="/admin/service-metrics">
            <ServiceMetrics />
          </Route>
          <Route path="/admin/access">
            <AccessPage />
          </Route>
          <Route exact path="/admin/services/directory">
            <Directory />
          </Route>
          <Route exact path="/admin/services/calendar">
            <Calendar />
          </Route>
          <Route exact path="/admin/services/configuration">
            <Configuration />
          </Route>
          <Route path="/admin/services/pdf" component={PDFRouter} />
          <Route exact path="/admin/services/file">
            <File />
          </Route>
          <Route path="/admin/services/form" component={FormRouter} />
          <Route path="/admin/services/status">
            <Status />
          </Route>
          <Route path="/admin/services/script">
            <Script />
          </Route>
          <Route path="/admin/services/event">
            <Events />
          </Route>
          <Route path="/admin/services/notification">
            <Notifications />
          </Route>
          <Route path="*" render={() => <Redirect to="/404" />} />
        </Switch>
      </Container>
    </AdminLayout>
  );
};

export default TenantManagement;

const AdminLayout = styled.div`
  display: flex;
`;

const SidebarWrapper = styled.nav`
  flex: 0 0 0;
  transition: flex-basis 200ms;
  overflow-x: hidden;

  @media (min-width: 768px) {
    flex-basis: 12rem;
  }
`;
