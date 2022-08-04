import '@style/app.css';
import '@style/colors.scss';
import React, { useEffect } from 'react';
import { Route, BrowserRouter as Router, Switch, Redirect } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';

import LandingPage from '@pages/public/Landing';
import Login from '@pages/public/Login';
import LogoutRedirect from '@pages/public/LogoutRedirect';
import { store, RootState } from '@store/index';
import { PrivateApp, PrivateRoute } from './privateApp';
import { fetchConfig } from '@store/config/actions';
import AuthContext from '@lib/authContext';

import { ThemeProvider } from 'styled-components';
import { theme } from 'theme';
import PublicApp from './publicApp';
import Subscriptions from '@pages/private/Subscriptions/Subscriptions';
import PublicSubscriptions from '@pages/public/Subscriptions';
import Recaptcha from './components/Recaptcha';

const AppRouters = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" render={() => <Redirect to="/overview" />} />

        <Route path="/subscriptions/:realm">
          <PrivateApp>
            <PrivateRoute path="/subscriptions/:realm" component={Subscriptions} />
          </PrivateApp>
        </Route>

        <PublicApp>
          <Switch>
            <Route exact path="/overview">
              <LandingPage />
            </Route>

            <Route exact path="/logout-redirect">
              <LogoutRedirect />
            </Route>

            <Route path="/:realm/login">
              <Login />
            </Route>

            <Route exact path="/:subscriberId">
              <Route path="/:subscriberId" component={PublicSubscriptions} />
            </Route>
          </Switch>
        </PublicApp>
      </Switch>
    </Router>
  );
};

export const App = (): JSX.Element => {
  return (
    <div style={{ overflowX: 'hidden', minHeight: '100vh' }}>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <AppWithAuthContext />
        </Provider>
      </ThemeProvider>
    </div>
  );
};

function AppWithAuthContext() {
  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);
  const recaptchaKey = useSelector((state: RootState) => state.config?.recaptchaKey);

  const dispatch = useDispatch();
  useEffect(() => {
    // Fetch config
    if (!keycloakConfig) {
      dispatch(fetchConfig());
    }
  }, [dispatch, keycloakConfig]);

  return (
    <div>
      <AuthContext.Provider value={{}}>{keycloakConfig && <AppRouters />}</AuthContext.Provider>
      {recaptchaKey && <Recaptcha siteKey={recaptchaKey} />}
    </div>
  );
}

export default App;
