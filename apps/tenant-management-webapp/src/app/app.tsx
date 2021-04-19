import React, { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';

import '@abgov/react-components/react-components.esm.css';
import '@abgov/core-css/goa-core.css';

import LandingPage from '@pages/public/Landing';
import Login from '@pages/public/Login';
import CaseStudy from '@pages/admin/CaseStudy';
import FileService from '@pages/public/FileService';
import ServiceMeasure from '@pages/admin/ServiceMeasure';
import AppStatus from '@pages/admin/AppStatus';
import Integration from '@pages/admin/Integration';
import Notifications from '@pages/admin/Notifications';
import TenantManagement from '@pages/admin/tenant-management';
import { TenantsRouter } from '@pages/admin/tenants';
import GetStarted from '@pages/public/GetStarted';
import { store, persistor, RootState } from '@store/index';
import { PersistGate } from 'redux-persist/integration/react';
import { PrivateApp, PrivateRoute } from './privateApp';
import { ConfigLogout, fetchConfig } from '@store/config/actions';
import { SessionLoginSuccess, SessionLogout } from '@store/session/actions';
import AuthContext from '@lib/authContext';
import { keycloak, createKeycloakInstance, convertToSession } from '@lib/session';
import { ThemeProvider } from 'styled-components';
import { theme } from 'theme';
import { TenantLogout } from '@store/tenant/actions';
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
          <Route path="/:tenantName/login">
            <Login />
          </Route>
          <Route path="/get-started">
            <GetStarted />
          </Route>
          <Route path="/login">
            <Login />
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
          <PersistGate loading={null} persistor={persistor}>
            <AppWithAuthContext />
          </PersistGate>
        </Provider>
      </ThemeProvider>
    </div>
  );
};

function AppWithAuthContext() {
  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);
  const tenant = useSelector((state: RootState) => state.tenant);
  const dispatch = useDispatch();
  const [hasSession, setHasSession] = useState<boolean>(false);

  const location: string = window.location.href;
  const skipSSO = location.indexOf('kc_idp_hint') > -1;

  useEffect(() => {
    dispatch(fetchConfig());
  }, [dispatch]);

  useEffect(() => {
    if (keycloakConfig?.realm) {
      createKeycloakInstance(tenant.name ? { ...keycloakConfig, realm: tenant.name } : keycloakConfig);
      setHasSession(true);
    }
  }, [keycloakConfig, tenant]);

  useEffect(() => {
    if (!hasSession) return;

    keycloak.init({ onLoad: 'check-sso' }).then((authenticated: boolean) => {
      if (authenticated) {
        keycloak
          .loadUserInfo()
          .then(() => {
            const session = convertToSession(keycloak);
            dispatch(SessionLoginSuccess(session));
          })
          .catch((e) => {
            console.error('failed loading user info', e);
          });
      } else {
        dispatch(SessionLogout());
      }
    });
  }, [dispatch, hasSession]);

  function signIn(redirectPath: string) {
    const redirectUri = `${window.location.origin}${redirectPath}`;
    if (skipSSO) {
      keycloak.init({}).then(() => {
        keycloak.login({ idpHint: ' ', redirectUri });
      });
    } else {
      keycloak.init({ onLoad: 'login-required', redirectUri });
    }
  }

  function signOut() {
    dispatch(SessionLogout());
    dispatch(TenantLogout());
    dispatch(ConfigLogout());
    keycloak.logout({ redirectUri: window.location.origin });
  }

  return <AuthContext.Provider value={{ signIn, signOut }}>{hasSession && <AppRouters />}</AuthContext.Provider>;
}

export default App;
