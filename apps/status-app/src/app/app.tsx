import React, { useEffect } from 'react';

import '@abgov/core-css/goa-core.css';
import '@abgov/core-css/goa-components.css';
import '@abgov/core-css/src/lib/stories/page-template/page-template.story.scss';

import { fetchConfig } from './store/config/actions';
import { useDispatch, useSelector } from 'react-redux';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import ServiceStatusPage from './pages/status';
import { RootState} from '@store/index'

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
    <> { config.envLoaded &&
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
    }
    </>

  );
}

export default App;
