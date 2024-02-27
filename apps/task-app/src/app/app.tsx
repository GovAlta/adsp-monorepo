import '@abgov/web-components/index.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom-6';
import { TaskTenant } from './containers/TaskTenant';

import styles from './app.module.scss';
import { AuthCallback } from './components/AuthCallback';
import { Landing } from './components/Landing';
import Login from './pages/public/Login';

export function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Routes>
          <Route index element={<Navigate to="/overview" />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="overview" element={<Landing />} />
          <Route path="/:tenant/*" element={<TaskTenant />} />
          <Route path="/:tenant/login" element={<Login />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
