import '@abgov/web-components/index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom-6';
import { TaskTenant } from './containers/TaskTenant';

import styles from './app.module.scss';
import { AuthCallback } from './components/AuthCallback';
import { PrivateApp } from './privateApp';
import { PublicApp } from './publicApp';

export function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/tasks/:tenant/*" element={<PrivateApp />} />
          <Route path="/*" element={<PublicApp />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
