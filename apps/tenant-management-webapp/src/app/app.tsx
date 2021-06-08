import React, { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';

import '@abgov/react-components/react-components.esm.css';
import '@abgov/core-css/goa-core.css';

import LandingPage from '@pages/public/Landing';

import Login from '@pages/public/Login';
import AutoLogin from '@pages/public/AutoLogin';
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
import { store, persistor, RootState } from '@store/index';
import { PersistGate } from 'redux-persist/integration/react';
import { PrivateApp, PrivateRoute } from './privateApp';
import { fetchConfig } from '@store/config/actions';
import { SessionLoginSuccess, SessionLogout } from '@store/session/actions';
import AuthContext from '@lib/authContext';
import { keycloak, createKeycloakInstance, convertToSession } from '@lib/session';
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
          <Route path="/:tenantName/login">
            <Login />
          </Route>

          <Route path="/:tenantName/autologin">
            <AutoLogin />
          </Route>

          <Route path="/login">
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
  const config = useSelector((state: RootState) => state.config);
  console.log(JSON.stringify(config) + '<state.config');
  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);
  const stateSession = useSelector((state: RootState) => state.session);
  const tenant = useSelector((state: RootState) => state.tenant);
  const dispatch = useDispatch();
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [keyCloakAction, setKeyCloakAction] = useState<boolean>(false);

  const location: string = window.location.href;
  const skipSSO = location.indexOf('kc_idp_hint') > -1;

  useEffect(() => {
    dispatch(fetchConfig());
  }, [dispatch]);

  useEffect(() => {
    console.log(JSON.stringify(keycloakConfig?.realm) + '<keycloakConfig?.realm');

    if (keycloakConfig?.realm) {
      console.log(
        JSON.stringify(tenant.realm ? { ...keycloakConfig, realm: tenant.realm } : keycloakConfig) +
          '<tenant.realm ? { ...keycloakConfig, realm: tenant.realm } : keycloakConfig'
      );
      createKeycloakInstance(tenant.realm ? { ...keycloakConfig, realm: tenant.realm } : keycloakConfig);
      console.log('has session - true');
      setHasSession(true);
    }
  }, [keycloakConfig, tenant]);

  useEffect(() => {
    if (!hasSession) return;
    console.log('app session');

    keycloak.init({ onLoad: 'check-sso' }).then((authenticated: boolean) => {
      console.log('are we authed: ' + authenticated);
      if (authenticated) {
        keycloak
          .loadUserInfo()
          .then(() => {
            console.log('check-sso');
            const session = convertToSession(keycloak);
            console.log(JSON.stringify(stateSession) + '<stateSession');
            dispatch(SessionLoginSuccess(session));
            console.log(JSON.stringify(stateSession) + '<stateSession2');

            setKeyCloakAction(true);
          })
          .catch((e) => {
            console.error('failed loading user info', e);
          });
      } else {
        dispatch(SessionLogout());
      }
      console.log('do we get here');
    });
  }, [dispatch, hasSession]);

  function signIn(redirectPath: string) {
    console.log('redirecting:xx' + JSON.stringify(`${window.location.origin}${redirectPath}`));
    const redirectUri = `${window.location.origin}${redirectPath}`;
    if (skipSSO) {
      keycloak.init({}).then(() => {
        keycloak.login({ idpHint: ' ', redirectUri });
      });
    } else {
      console.log('redirecting' + JSON.stringify(redirectUri));
      try {
        keycloak.init({ onLoad: 'login-required', redirectUri });
      } catch (e) {
        console.log('error' + e);
      }
    }
  }

  function signOut() {
    const path = window.location.origin + '/logout-redirect';
    keycloak.logout({ redirectUri: path });
  }

  console.log(JSON.stringify(hasSession) + '<hasSessions sss');

  return (
    <AuthContext.Provider value={{ signIn, signOut }}>
      {hasSession && keyCloakAction && <AppRouters />}
    </AuthContext.Provider>
  );
}

export default App;
