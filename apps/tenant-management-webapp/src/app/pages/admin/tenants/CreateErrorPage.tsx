import React from 'react';
import GoALinkButton from '@components/LinkButton';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';

const CreateErrorPage = (): JSX.Element => {
  return (
    <Page>
      <Main>
        <h2>There was a problem creating your tenant</h2>
        <p>We apologize for the inconvenience, but we could not successfully create your tenant, please try again.</p>
        <GoALinkButton to="/admin/tenants/create" buttonType="primary">
          Create Tenant
        </GoALinkButton>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};

export default CreateErrorPage;
