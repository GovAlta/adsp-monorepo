import React from 'react';

import '@abgov/core-css/goa-core.css';
import '@abgov/core-css/goa-components.css';
import '@abgov/core-css/src/lib/stories/page-template/page-template.story.scss';

import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import ServiceStatusPage from './pages/ServiceStatuses';

export function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <ServiceStatusPage />
        </Route>
        <Route path="/:realm">
          <ServiceStatusPage />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
