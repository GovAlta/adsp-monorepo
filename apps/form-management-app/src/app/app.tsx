import '@abgov/web-components/index.css';
import { AuthCallback } from '@core-services/app-common';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useParams, useLocation } from 'react-router-dom';

import styles from './app.module.scss';
import { Layout } from './layout';
import Login from './pages/public/Login';
import TenantManagement from './pages/admin/index';
import FormDefinitions from './pages/admin/FormDefinitions';
import FormEditor from './pages/admin/FormEditor';
import FormPreview from './pages/admin/FormPreview';
import CreateFormDefinition from './pages/admin/CreateFormDefinition';
import { AppDispatch, configInitializedSelector, initializeTenant, userSelector } from './state';

const TenantGuard = ({ children }: { children: React.ReactNode }) => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized, user } = useSelector(userSelector);

  useEffect(() => {
    if (configInitialized && tenantName) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  if (!userInitialized) return null;

  if (!user) {
    return <Navigate to={`/${tenantName}/login?from=${encodeURIComponent(location.pathname)}`} />;
  }

  return children;
};

const LayoutWrapper = () => (
  <TenantGuard>
    <Layout serviceName="Form Management" admin>
      <Outlet />
    </Layout>
  </TenantGuard>
);

const LayoutWrapperBasic = () => (
  <TenantGuard>
    <div>
      <Outlet />
    </div>
  </TenantGuard>
);

export function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Routes>
          {/* Routes without layout */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/:tenant/login" element={<Login />} />

          <Route path="/:tenant">
            {/* Default tenant layout */}
            <Route element={<LayoutWrapper />}>
              <Route index element={<TenantManagement />} />
              <Route path="forms" element={<FormDefinitions />} />
              <Route path="forms/new" element={<CreateFormDefinition />} />
              <Route path="forms/edit/:id" element={<CreateFormDefinition />} />
              <Route path="preview/:formId" element={<FormPreview />} />
            </Route>

            {/* Editor uses a different layout */}
            <Route element={<LayoutWrapperBasic />}>
              <Route path="editor/:id" element={<FormEditor />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </div>
  );
}
export default App;
