import '@abgov/web-components/index.css';
import { Route, Routes } from 'react-router-dom';
import styles from './app.module.scss';
import { Landing } from './components/Landing';

import { SandBoxTenant } from './components/SandboxTenant';
import { Login } from './components/Login';
import { SandboxAuthCallback } from './containers/SandboxAuthCallback';
import { useAdspFeedbackWidget } from './util/useFeedbackWidget';

declare global {
  interface Window {
    adspFeedback: {
      initialize: (options: { tenant: string }) => void;
      openFeedbackForm: () => void;
    };
  }
}

export function App() {
  useAdspFeedbackWidget();
  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/auth/callback" element={<SandboxAuthCallback />} />
        <Route path="/:tenant/*" element={<SandBoxTenant />} />
        <Route path="/:realm/login" element={<Login />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </div>
  );
}

export default App;
