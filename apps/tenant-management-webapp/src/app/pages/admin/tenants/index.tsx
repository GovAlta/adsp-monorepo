import Container from '@components/Container';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import ActivateErrorPage from './ActivateErrorPage';
import AddClientRole from './AddClientRole';
import CreateErrorPage from './CreateErrorPage';
import CreateTenant from './CreateTenant';
import CreatingTenant from './CreatingTenant';
import Tenants from './Tenants';

export function TenantsRouter() {
  return (
    <Container hs={1} vs={2}>
      <Switch>
        <Route path="/admin/tenants" exact component={Tenants} />
        <Route path="/admin/tenants/create" component={CreateTenant} />
        <Route path="/admin/tenants/creating" component={CreatingTenant} />
        <Route path="/admin/tenants/add-role" component={AddClientRole} />
        <Route path="/admin/tenants/creation-error" component={CreateErrorPage} />
        <Route path="/admin/tenants/activation-error" component={ActivateErrorPage} />
      </Switch>
    </Container>
  );
}
