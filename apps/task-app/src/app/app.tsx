import '@abgov/web-components/index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom-6';
import { Landing } from './components/Landing';
import { TaskTenant } from './containers/TaskTenant';

import styles from './app.module.scss';
import { AuthCallback } from './components/AuthCallback';

export function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/:tenant/*" element={<TaskTenant />} />
          <Route path="*" element={<Landing />}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
