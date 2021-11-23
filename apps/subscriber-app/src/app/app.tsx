import { useEffect } from 'react';

import '@abgov/core-css/goa-core.css';
import '@abgov/core-css/goa-components.css';
import '@abgov/core-css/src/lib/stories/page-template/page-template.story.scss';

import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import SubscriberPage from './pages/subscriber';

export function App(): JSX.Element {
  useEffect(() => {
    // TODO Fetch config
    // dispatch(fetchConfig());
  }, []);
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <SubscriberPage />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
