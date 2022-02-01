import React, { useEffect } from 'react';
import '@style/app.css';
import '@style/colors.scss';
import '@style/goa-core.scss';
import { fetchConfig } from './store/config/actions';
import { useDispatch, useSelector } from 'react-redux';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import ServiceStatusPage from './pages/status';
import Recaptcha from './components/Recaptcha';
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
      <Recaptcha siteKey={config.recaptchaKey} />
    </div>
  );
}

export default App;
