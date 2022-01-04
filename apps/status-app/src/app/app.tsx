import React, { useEffect } from 'react';
import '../../../../libs/stylesheets/scss/src/lib/app.css';
import '../../../../libs/stylesheets/scss/src/lib/goa-core.scss';
import '../../../../libs/stylesheets/scss/src/lib/colors.scss';
import { fetchConfig } from './store/config/actions';
import { useDispatch, useSelector } from 'react-redux';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import ServiceStatusPage from './pages/status';
import { RootState } from '@store/index';

export function App(): JSX.Element {
  const dispatch = useDispatch();

  const { config } = useSelector((state: RootState) => ({
    config: state.config,
  }));
  useEffect(() => {
    // Fetch config
    dispatch(fetchConfig());
  }, []);

  return (
    <div>
      {config.envLoaded && (
        <Router>
          <Switch>
            <Route exact path="/">
              <ServiceStatusPage />
            </Route>
            <Route exact path="/:name">
              <ServiceStatusPage />
            </Route>
          </Switch>
        </Router>
      )}
    </div>
  );
}

export default App;
