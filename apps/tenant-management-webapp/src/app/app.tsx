import React from 'react';

import './app.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@abgov/react-components/react-components.esm.css';

import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import LandingPage from './components/landingPage';
import Login from './components/login/';
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

export const App = () => {
  return (
    <div>
      <main>
        <Router>
          <div>
            <Switch>
              <Route exact path="/">
                <LandingPage />
              </Route>
              <Route path="/login">
                <Login />
              </Route>
              <Route path="/sign-up">
                <SignUp />
              </Route>
              <Route path="/case-study">
                <CaseStudy />
              </Route>
              <Route path="/file-service">
                <FileService />
              </Route>
              <Route path="/service-measures">
                <ServiceMeasure />
              </Route>
              <Route path="/app-status">
                <AppStatus />
              </Route>
              <Route path="/notifications">
                <Notifications />
              </Route>
              <Route path="/integration">
                <Integration />
              </Route>
              <Route path="/tenant-admin">
                <TenantManagement />
              </Route>
              <Route path="/Realms" exact component={Realms}/>
              <Route path="/Realms/CreateRealm" exact component={CreateRealm}/>
              <Route path="/Realms/CreatingRealm" exact component={CreatingRealm}/>
              <Route path="/Realms/AddClientRole" exact component={AddClientRole}/>
              <Route path="/Realms/CreateErrorPage" exact component={CreateErrorPage}/>
              <Route path="/Realms/ActivateErrorPage" exact component={ActivateErrorPage}/>
            </Switch>
          </div>
        </Router>
      </main>
    </div>
  );
};

export default App;
