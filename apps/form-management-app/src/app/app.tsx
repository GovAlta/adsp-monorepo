import '@abgov/web-components/index.css';
import { AuthCallback } from '@core-services/app-common';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import styles from './app.module.scss';
import { Landing } from './components/Landing';
import Login from './pages/public/Login';
import LoginRedirect from './pages/public/LoginRedirect';
import TenantManagement from './pages/admin/index';

declare global {
  interface Window {
    adspFeedback: {
      initialize: (options: { tenant: string }) => void;
      openFeedbackForm: () => void;
    };
  }
}

export function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Routes>
          {/* <Route index element={<Navigate to="/overview" />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="overview" element={<Landing />} />
          <Route path="/:tenant/*" element={<TenantManagement />} />
          <Route path="/:tenant/login" element={<Login />} /> */}

          {/* Auth callback route: must mount a component that triggers session initialization */}
          <Route path="/auth/callback" element={<LoginRedirect />} />
          <Route path="login-redirect" element={<LoginRedirect />} />

          {/* Overview route */}
          <Route path="/overview" element={<Landing />} />

          {/* Tenant-specific routes: ensures initialization when mounted */}
          <Route path="/:tenant/*" element={<TenantManagement />} />

          {/* Explicit login routes for tenant or realm */}
          <Route path="/:tenant/login" element={<Login />} />
          <Route path="/:realm/login" element={<Login />} />

          {/* Catch-all redirects to overview */}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </Router>
    </div>
  );
}
export default App;
