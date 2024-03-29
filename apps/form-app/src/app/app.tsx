import '@abgov/web-components/index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom-6';
import { AuthCallback } from './components/AuthCallback';
import { FormTenant } from './containers/FormTenant';
import { Landing } from './components/Landing';

import styles from './app.module.scss';

export function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/:tenant/*" element={<FormTenant />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
