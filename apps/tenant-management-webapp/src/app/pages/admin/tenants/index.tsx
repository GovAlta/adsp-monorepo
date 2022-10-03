import Container from '@components/Container';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import ActivateErrorPage from './ActivateErrorPage';
import AddClientRole from './AddClientRole';
import CreateErrorPage from './CreateErrorPage';
import CreatingTenant from './CreatingTenant';
import Tenants from './Tenants';

export function TenantsRouter(): JSX.Element {
  return (
    <Container hs={1} vs={2}>
      <Switch>
        <Route exact path="/admin/tenants">
          <Tenants />
        </Route>

        <Route path="/admin/tenants/creating">
          <CreatingTenant />
        </Route>
        <Route path="/admin/tenants/add-role">
          <AddClientRole />
        </Route>
        <Route path="/admin/tenants/creation-error">
          <CreateErrorPage />
        </Route>
        <Route path="/admin/tenants/activation-error">
          <ActivateErrorPage />
        </Route>
      </Switch>
    </Container>
  );
}
