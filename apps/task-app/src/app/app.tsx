import '@abgov/web-components/index.css';
import { Redirect, Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Landing } from './components/Landing';
import { TaskTenant } from './containers/TaskTenant';

import styles from './app.module.scss';
import { AuthCallback } from './components/AuthCallback';

export function App() {
  return (
    <div className={styles.app}>
      <Router>
        <Switch>
          <Route path="/auth/callback">
            <AuthCallback />
          </Route>
          <Route path="/:tenant">
            <TaskTenant />
          </Route>
          <Route>
            <Landing />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
