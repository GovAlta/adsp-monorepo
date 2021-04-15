import Container from '@components/_/Container';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import ActivateErrorPage from './ActivateErrorPage';
import AddClientRole from './AddClientRole';
import CreateErrorPage from './CreateErrorPage';
import CreateTenant from './CreateTenant';
import CreatingTenant from './CreatingTenant';
import GetStarted from './GetStarted';
import Tenants from './Tenants';

function TenantsRouter() {
  return (
    <Container hs={1} vs={2}>
      <Switch>
        <Route path="/tenants" exact component={Tenants} />
        <Route path="/tenants/start" component={GetStarted} />
        <Route path="/tenants/create" component={CreateTenant} />
        <Route path="/tenants/creating" component={CreatingTenant} />
        <Route path="/tenants/add-role" component={AddClientRole} />
        <Route path="/tenants/creation-error" component={CreateErrorPage} />
        <Route path="/tenants/activation-error" component={ActivateErrorPage} />
      </Switch>
    </Container>
  );
}

export default TenantsRouter;
