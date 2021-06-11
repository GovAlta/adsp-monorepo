import React, { useEffect } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';

import '@abgov/react-components/react-components.esm.css';
import '@abgov/core-css/goa-core.css';

import LandingPage from '@pages/public/Landing';
import Login from '@pages/public/Login';
import LoginRedirect from '@pages/public/LoginRedirect';
import LogoutRedirect from '@pages/public/LogoutRedirect';
import CaseStudy from '@pages/admin/CaseStudy';
import FileService from '@pages/public/FileService';
import ServiceMeasure from '@pages/admin/ServiceMeasure';
import AppStatus from '@pages/admin/AppStatus';
import Integration from '@pages/admin/Integration';
import Notifications from '@pages/admin/Notifications';
import TenantManagement from '@pages/admin/tenant-management';
import { TenantsRouter } from '@pages/admin/tenants';
import GetStarted from '@pages/public/GetStarted';
import { store, RootState } from '@store/index';
import { PrivateApp, PrivateRoute } from './privateApp';
import { fetchConfig } from '@store/config/actions';
import AuthContext from '@lib/authContext';
import { keycloakAuth, LOGIN_TYPES } from '@lib/keycloak';
import CreateTenant from '@pages/admin/tenants/CreateTenant';

import { ThemeProvider } from 'styled-components';
import { theme } from 'theme';
import PublicApp from './publicApp';

import './app.css';

const AppRouters = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <LandingPage />
        </Route>

        <Route path="/admin">
          <PrivateApp>
            <PrivateRoute path="/admin/case-study" component={CaseStudy} />
            <PrivateRoute path="/admin/file-service" component={FileService} />
            <PrivateRoute path="/admin/service-measures" component={ServiceMeasure} />
            <PrivateRoute path="/admin/app-status" component={AppStatus} />
            <PrivateRoute path="/admin/notifications" component={Notifications} />
            <PrivateRoute path="/admin/integration" component={Integration} />
            <PrivateRoute path="/admin/tenant-admin" component={TenantManagement} />
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

export const App = () => {
  return (
    <div style={{ overflowX: 'hidden' }}>
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
      console.log('fetch config');
      dispatch(fetchConfig());
    }
  }, []);

  return <AuthContext.Provider value={{}}>{keycloakConfig?.realm && <AppRouters />}</AuthContext.Provider>;
}

export default App;
