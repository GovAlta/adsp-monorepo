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
import { AppDispatch, configInitializedSelector, initializeTenant, userSelector } from './state';

// Layout wrapper component
const LayoutWrapper = () => {
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

  if (!userInitialized) {
    return null;
  }

  if (!user) {
    return <Navigate to={`/${tenantName}/login?from=${encodeURIComponent(location.pathname)}`} />;
  }

  return (
    <Layout serviceName="Form Management" admin={true}>
      <Outlet />
    </Layout>
  );
};

export function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Routes>
          {/* Routes without layout */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/:tenant/login" element={<Login />} />

          {/* Routes with layout */}
          <Route path="/:tenant" element={<LayoutWrapper />}>
            <Route index element={<TenantManagement />} />
            <Route path="forms" element={<FormDefinitions />} />
            <Route path="editor/:formId" element={<FormEditor />} />
            <Route path="preview" element={<FormPreview />} />
            <Route path="preview/:formId" element={<FormPreview />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}
export default App;
