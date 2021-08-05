import React, { useEffect } from 'react';

import '@abgov/core-css/goa-core.css';
import '@abgov/core-css/goa-components.css';
import '@abgov/core-css/src/lib/stories/page-template/page-template.story.scss';

import { fetchConfig } from './store/config/actions';
import { useDispatch } from 'react-redux';

import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import ServiceStatusPage from './pages/ServiceStatuses';

export function App(): JSX.Element {
  const dispatch = useDispatch();
  useEffect(() => {
    // Fetch config
    dispatch(fetchConfig());
  }, []);

  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <ServiceStatusPage />
        </Route>
        <Route exact path="/:realm">
          <ServiceStatusPage />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
