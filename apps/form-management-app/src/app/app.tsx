import '@abgov/web-components/index.css';
import { AuthCallback } from '@core-services/app-common';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';

import styles from './app.module.scss';
import { Layout } from './layout';
import Login from './pages/public/Login';
import TenantManagement from './pages/admin/index';
import FormDefinitions from './pages/admin/FormDefinitions';
import FormEditor from './pages/admin/FormEditor';
import FormPreview from './pages/admin/FormPreview';

declare global {
  interface Window {
    adspFeedback: {
      initialize: (options: { tenant: string }) => void;
      openFeedbackForm: () => void;
    };
  }
}

// Layout wrapper component
const LayoutWrapper = () => {
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
            <Route path="preview/:formId" element={<FormPreview />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}
export default App;
