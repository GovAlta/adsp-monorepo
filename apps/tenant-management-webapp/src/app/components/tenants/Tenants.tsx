import React from 'react';
import GoALinkButton from '@components/_/LinkButton';
import { Aside, Main, Page } from '@components/_/Html';
import SupportLinks from '@components/_/SupportLinks';

const Tenants = () => {
  return (
    <Page>
      <Main>
        <h1>Welcome Platformer!</h1>
        <p>
          Creating and activating your own tenant requires a few steps. You must start by creating a tenant. Once the
          tenant has been created, you will be asked to activate the tenant.
        </p>

        <h2>Create Tenant</h2>
        <p>Before you start, please ensure these guidelines have been met:</p>
        <ul>
          <li>You have not already created a tenant with your current account</li>
          <li>This is for a ministry approved project</li>
        </ul>

        <GoALinkButton to="/tenants/start" buttonType="primary">
          Create Tenant
        </GoALinkButton>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};

export default Tenants;
