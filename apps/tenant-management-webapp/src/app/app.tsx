import '@style/app.css';
import '@style/colors.scss';

import React, { useEffect } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';

import LandingPage from '@pages/public/Landing';
import { SignInError } from '@pages/public/SignInError';

import Login from '@pages/public/Login';
import LoginRedirect from '@pages/public/LoginRedirect';
import LogoutRedirect from '@pages/public/LogoutRedirect';
import Admin from '@pages/admin';
import { TenantsRouter } from '@pages/admin/tenants';
import GetStarted from '@pages/public/GetStarted';
import { store, RootState } from '@store/index';
import { PrivateApp, PrivateRoute } from './privateApp';
import { fetchConfig } from '@store/config/actions';
import AuthContext from '@lib/authContext';
import CreateTenant from '@pages/admin/tenants/CreateTenant';

import { ThemeProvider } from 'styled-components';
import { theme } from 'theme';
import PublicApp from './publicApp';

const AppRouters = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <LandingPage />
        </Route>

        <Route path="/admin">
          <PrivateApp>
            <PrivateRoute path="/admin" component={Admin} />
            <PrivateRoute path="/admin/tenants" component={TenantsRouter} />
          </PrivateApp>
        </Route>

        <PublicApp>
          <Route path="/:realm/autologin">
            <Login />
          </Route>
          <Route path="/get-started">
            <GetStarted />
          </Route>
          <Route exact path="/login-redirect">
            <LoginRedirect />
          </Route>
          <Route exact path="/login-error">
            <SignInError />
          </Route>
          <Route exact path="/logout-redirect">
            <LogoutRedirect />
          </Route>
          <Route exact path="/tenant/creation">
            <CreateTenant />
          </Route>
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
  const dispatch = useDispatch();
  useEffect(() => {
    // Fetch config
    if (!keycloakConfig) {
      dispatch(fetchConfig());
    }
  }, [dispatch, keycloakConfig]);

  return <AuthContext.Provider value={{}}>{keycloakConfig?.realm && <AppRouters />}</AuthContext.Provider>;
}

export default App;
