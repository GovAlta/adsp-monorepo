import '@abgov/web-components/index.css';
import { Route, Routes } from 'react-router-dom';
import styles from './app.module.scss';
import { Landing } from './components/Landing';

import { SandBoxTenant } from './components/SandboxTenant';
import { Login } from './components/Login';

import { useFeedbackWidget } from './hooks/useFeedbackWidget';
import { useFeedbackScript } from './hooks/useFeedbackScript';
import Services from './components/Services';
import { useSelector } from 'react-redux';
import { environmentSelector } from './state';
import { AuthCallback } from '@core-services/app-common';

declare global {
  interface Window {
    adspFeedback: {
      initialize: (options: { tenant: string }) => void;
      openFeedbackForm: () => void;
    };
  }
}
export function App() {
  const environment = useSelector(environmentSelector);
  useFeedbackScript(environment.tenantName);
  useFeedbackWidget(environment.tenantName);
  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/:tenant/services" element={<Services />} />
        <Route path="/:tenant/login" element={<Login />} />
        <Route path="/:tenant/signin" element={<Login />} />
        <Route path="/:tenant/*" element={<SandBoxTenant />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </div>
  );
}

export default App;
