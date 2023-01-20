import React from 'react';

import { Main, Page } from '@components/Html';

const EditorPage = (): JSX.Element => {
  return (
    <Page>
      <Main>
        <h2>Welcome editor!</h2>
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
      </Main>
    </Page>
  );
};

export default EditorPage;
