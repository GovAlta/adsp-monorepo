import '@abgov/web-components/index.css';
import { Route, Routes } from 'react-router-dom';
import styles from './app.module.scss';
import { Landing } from './components/Landing';

import { SandBoxTenant } from './components/SandboxTenant';
import { Login } from './components/Login';
import { SandboxAuthCallback } from './containers/SandboxAuthCallback';
import { useFeedbackWidget } from './hooks/useFeedbackWidget';
import Services from './components/Services';
import './utils/feedback-script-loader';

declare global {
  interface Window {
    adspFeedback: {
      initialize: (options: { tenant: string }) => void;
      openFeedbackForm: () => void;
    };
  }
}
export function App() {
  useFeedbackWidget();
  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/auth/callback" element={<SandboxAuthCallback />} />
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
