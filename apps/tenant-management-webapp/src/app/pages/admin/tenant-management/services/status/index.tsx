import React from 'react';
import { Switch, Route } from 'react-router-dom';
import ApplicationForm from './form';
import StatusPage from './status';

function index(): JSX.Element {
  return (
    <Switch>
      <Route exact path="/admin/tenant-admin/services/service-status">
        <StatusPage />
      </Route>
      <Route path="/admin/tenant-admin/services/service-status/new">
        <ApplicationForm />
      </Route>
      <Route path="/admin/tenant-admin/services/service-status/:applicationId/edit">
        <ApplicationForm />
      </Route>
    </Switch>
  );
}

export default index;
