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
            </Switch>
          </div>
        </Router>
      </main>
    </div>
  );
};

export default App;
