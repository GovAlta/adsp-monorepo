import '@abgov/web-components/index.css';
import { AuthCallback } from '@core-services/app-common';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import styles from './app.module.scss';
import { Landing } from './components/Landing';
//import Login from '..//pages/public/Login';
import { Login } from '../app/pages/public/Login';

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
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/overview" element={<Landing />} />
          <Route path="/:tenant/*" element={<TenantManagement />} />
          <Route path={`/:realm/:definitionId/login`} element={<Login />} />
          <Route path="/:realm/login" element={<Login />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Router>
    </div>
  );
}
export default App;
