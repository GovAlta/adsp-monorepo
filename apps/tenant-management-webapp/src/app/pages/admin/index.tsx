import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom-6';
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
import { Configuration } from './services/configuration';
import { Calendar } from './services/calendar';
import { PDFRouter } from './services/pdf';
import { CommentRouter } from './services/comment';
import { FormRouter } from './services/form';
import { FileRouter } from './services/file';
import { serviceVariables } from '../../../featureFlag';

import { Script } from './services/script';
import { CommentTopicTypesEditor } from './services/comment/topicTypes/commentTopicTypesEditor';
import { PdfTemplatesEditor } from './services/pdf/templates/pdfTemplateEditor';
import { FormDefinitionEditor } from './services/form/definitions/formDefinitionEditor';
import { FileTypeDefinitionEditor } from './services/file/fileTypes/fileTypeDefinitionEditor';
import { TaskDefinitionEditor } from './services/task/TaskDefinationEditor';

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
        return <FileRouter />;
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
        return <Navigate to="/404" />;
    }
  };

  return (
    <AdminLayout>
      <Routes>
        {/* These paths forces the scrollbars to be hidden when in the editor */}
        <Route path="services/form/edit/:id" element={<FormDefinitionEditor />} />
        <Route path="services/pdf/edit/:id" element={<PdfTemplatesEditor />} />
        <Route path="services/task/edit/:id" element={<TaskDefinitionEditor />} />
        <Route path="services/comment/edit/:id" element={<CommentTopicTypesEditor />} />
        <Route path="services/file/edit/:id" element={<FileTypeDefinitionEditor />} />
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
            return <Route path={service.link + '/*'} key={service.link} element={renderServices(service.name)} />;
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
