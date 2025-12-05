import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { HeaderCtx } from '@lib/headerContext';

import Sidebar from './sidebar';
import Dashboard from './dashboard';

import AccessPage from './services/access/access';
import { Directory } from './services/directory';
import Container from '@components/Container';
import Status from './services/status';
import { TaskRouter } from './services/task';
import { EventLog } from './event-log';
import { ServiceMetrics } from './service-metrics';
import { Events } from './services/events';
import { Notifications } from './services/notifications';
import { ConfigurationRouter } from './services/configuration/routers';
import { Calendar } from './services/calendar';
import { PDFRouter } from './services/pdf';
import { CommentRouter } from './services/comment';
import { FormRouter } from './services/form';
import { FileRouter } from './services/file';
import { ValueRouter } from './services/value';
import { CacheRouter } from './services/cache';
import { AgentRouter } from './services/agent';
import { serviceVariables } from '../../../featureFlag';

import { ScriptRouter } from './services/script';
import { Feedback } from './services/feedback';

const TenantManagement = (): JSX.Element => {
  const { setTitle } = useContext(HeaderCtx);

  const config = useSelector((state: RootState) => state.config);

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant management');
    const feedback = globalThis['adspFeedback'];
    if (config.feedback && feedback) {
      feedback.initialize({ tenant: config.feedback.tenant, name: 'adsp', email: 'adsp@gov.ab.ca' });
    }
  }, [setTitle, config]);

  const renderServices = (serviceName) => {
    switch (serviceName) {
      case 'Access':
        return <AccessPage />;
      case 'Agent':
        return <AgentRouter />;
      case 'Cache':
        return <CacheRouter />;
      case 'Calendar':
        return <Calendar />;
      case 'Comment':
        return <CommentRouter />;
      case 'Configuration':
        return <ConfigurationRouter />;
      case 'Directory':
        return <Directory />;
      case 'Event':
        return <Events />;
      case 'File':
        return <FileRouter />;
      case 'Form':
        return <FormRouter />;
      case 'Notification':
        return <Notifications />;
      case 'PDF':
        return <PDFRouter />;
      case 'Script':
        return <ScriptRouter />;
      case 'Status':
        return <Status />;
      case 'Task':
        return <TaskRouter />;
      case 'Feedback':
        return <Feedback />;
      case 'Value':
        return <ValueRouter />;

      default:
        return <Navigate to="/404" />;
    }
  };

  return (
    <AdminLayout>
      <Routes>
        <Route
          path="*"
          element={
            <SidebarWrapper>
              <Sidebar type="desktop" />
            </SidebarWrapper>
          }
        />
      </Routes>

      <Container hs={1}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="/event-log" element={<EventLog />} />
          <Route path="/service-metrics" element={<ServiceMetrics />} />

          {serviceVariables(config.featureFlags).map((service) => {
            return (
              <Route
                path={service.link + '/*'}
                key={service.link}
                element={<ServiceColumnLayout>{renderServices(service.name)}</ServiceColumnLayout>}
              />
            );
          })}
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

const SidebarWrapper = styled.nav`
  flex: 0 0 0;
  transition: flex-basis 200ms;
  overflow-x: hidden;

  @media (min-width: 768px) {
    flex-basis: 12rem;
  }
`;

export const ServiceColumnLayout = styled.div`
  margin-bottom: var(--goa-space-3xl);
`;
