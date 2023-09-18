import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { HeaderCtx } from '@lib/headerContext';

import Sidebar from './sidebar';
import Dashboard from './dashboard';
import { File } from './services/file';

import AccessPage from './services/access/access';
import { Directory } from './services/directory';
import Container from '@components/Container';
import Status from './services/status';
import { TaskRouter } from './services/task';
import { EventLog } from './event-log';
import { ServiceMetrics } from './service-metrics';
import { Events } from './services/events';
import { Notifications } from './services/notifications';
import { Configuration } from './services/configuration';
import { Calendar } from './services/calendar';
import { PDFRouter } from './services/pdf';
import { CommentRouter } from './services/comment';
import { FormRouter } from './services/form';
import { serviceVariables } from '../../../featureFlag';

import { Script } from './services/script';

const TenantManagement = (): JSX.Element => {
  const { setTitle } = useContext(HeaderCtx);

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant management');
  }, [setTitle]);

  const config = useSelector((state: RootState) => state.config);

  const renderServices = (serviceName) => {
    switch (serviceName) {
      case 'Access':
        return <AccessPage />;
      case 'Calendar':
        return <Calendar />;
      case 'Comment':
        return <CommentRouter />;
      case 'Configuration':
        return <Configuration />;
      case 'Directory':
        return <Directory />;
      case 'Event':
        return <Events />;
      case 'File':
        return <File />;
      case 'Form':
        return <FormRouter />;
      case 'Notification':
        return <Notifications />;
      case 'PDF':
        return <PDFRouter />;
      case 'Script':
        return <Script />;
      case 'Status':
        return <Status />;
      case 'Task':
        return <TaskRouter />;
      default:
        return <Redirect to="/404" />;
    }
  };

  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/services/form/edit"></Route>
        <Route path="/admin/services/pdf/edit"></Route>
        <Route path="/admin/services/task/edit"></Route>
        <Route path="/admin/services/comment/edit"></Route>
        <Route path="*">
          <SidebarWrapper>
            <Sidebar type="desktop" />
          </SidebarWrapper>
        </Route>
      </Switch>

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

          {serviceVariables(config.featureFlags).map((service) => {
            return (
              <Route path={service.link} key={service.link}>
                {renderServices(service.name)}
              </Route>
            );
          })}

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
