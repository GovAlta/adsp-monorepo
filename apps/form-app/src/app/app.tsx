import '@abgov/web-components/index.css';
import { AuthCallback } from '@core-services/app-common';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { FormTenant } from './containers/FormTenant';
import { Landing } from './components/Landing';
import { Login } from './components/Login';
import styles from './app.module.scss';

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
          <Route path="/:tenant/*" element={<FormTenant />} />
          <Route path={`/:realm/:definitionId/login`} element={<Login />} />
          <Route path="/:realm/login" element={<Login />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
