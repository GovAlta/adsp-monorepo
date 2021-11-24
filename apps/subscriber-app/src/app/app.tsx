import { useEffect } from 'react';

import '@abgov/core-css/goa-core.css';
import '@abgov/core-css/goa-components.css';
import '@abgov/core-css/src/lib/stories/page-template/page-template.story.scss';

import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import SubscriberPage from './pages/subscriber';

import { fetchConfig } from './store/config/actions';
import { useDispatch, useSelector } from 'react-redux';
import { RootState} from '@store/index'

export function App(): JSX.Element {
  const dispatch = useDispatch();

  const { config } = useSelector((state: RootState) => ({
    config: state.config,
  }));
  useEffect(() => {
    dispatch(fetchConfig());
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
