import React, { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';

import './app.scss';
import '@abgov/react-components/react-components.esm.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@abgov/core-css/goa-core.css';

import LandingPage from './components/landingPage';
import { TenantLogin } from './components/login';
import Logout from './components/logout/';
import CaseStudy from './components/caseStudy/';
import FileService from './components/file-service';
import ServiceMeasure from './components/serviceMeasure';
import AppStatus from './components/appStatus';
import Integration from './components/integration';
import SignUp from './components/signUp';
import Notifications from './components/notifications';
import TenantManagement from './components/tenantManagement';
import CreateRealm from './components/realms/CreateRealm';
import CreatingRealm from './components/realms/CreatingRealm';
import AddClientRole from './components/realms/AddClientRole';
import CreateErrorPage from './components/realms/CreateErrorPage';
import ActivateErrorPage from './components/realms/ActivateErrorPage';
import Realms from './components/realms/Realms';
import BaseApp from './baseApp';
import { store, persistor, RootState } from '../app/store';
import { PersistGate } from 'redux-persist/integration/react';
import { PrivateRoute } from './customRoute';
import { fetchConfig } from './store/config/actions';
import AuthContext from './authContext';
import { SessionLoginSuccess, SessionLogout } from './store/session/actions';
import { keycloak, createKeycloakInstance, convertToSession } from './services/session';

const AppRouters = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <LandingPage />
        </Route>
        <Route path="/:tenantName/login">
          <TenantLogin />
        </Route>
        <Route path="/logout">
          <Logout />
        </Route>
        <Route path="/sign-up">
          <SignUp />
        </Route>
        <BaseApp>
          <PrivateRoute path="/case-study" component={CaseStudy} />
          <PrivateRoute path="/file-service" component={FileService} />
          <PrivateRoute path="/service-measures" component={ServiceMeasure} />
          <PrivateRoute path="/app-status" component={AppStatus} />
          <PrivateRoute path="/notifications" component={Notifications} />
          <PrivateRoute path="/integration" component={Integration} />
          <PrivateRoute path="/tenant-admin" component={TenantManagement} />

          <Route path="/Realms" exact component={Realms} />
          <Route path="/Realms/CreateRealm" exact component={CreateRealm} />
          <Route path="/Realms/CreatingRealm" exact component={CreatingRealm} />
          <Route path="/Realms/AddClientRole" exact component={AddClientRole} />
          <Route path="/Realms/CreateErrorPage" exact component={CreateErrorPage} />
          <Route path="/Realms/ActivateErrorPage" exact component={ActivateErrorPage} />
        </BaseApp>
      </Switch>
    </Router>
  );
};

export const App = () => {
  return (
    <main>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AppWithAuthContext />
        </PersistGate>
      </Provider>
    </main>
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
      keycloak.init({}).then((authenticated) => {
        if (authenticated) {
          keycloak.login({ idpHint: ' ', redirectUri });
        } else {
          console.error('failed authenticating the user.');
        }
      });
    } else {
      keycloak.init({ onLoad: 'login-required', redirectUri });
    }
  }

  function signOut() {
    const redirectUri = `${window.location.origin}/logout`;
    keycloak.logout({
      redirectUri,
    });
  }

  return <AuthContext.Provider value={{ signIn, signOut }}>{hasSession && <AppRouters />}</AuthContext.Provider>;
}

export default App;
