import React from 'react';
import { GoabButton } from '@abgov/react-components';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { AsidePadding } from '../../../components/Html';

const CreateErrorPage = (): JSX.Element => {
  return (
    <Page>
      <Main>
        <p>We apologize for the inconvenience, but we could not successfully activate your tenant. Please try again.</p>
        <GoabButton>Activate Tenant</GoabButton>
      </Main>
      <Aside>
        <AsidePadding>
          <h2>Need help?</h2>
          <p>If you continue to experience issues, please reach out to our support team for assistance.</p>
          <SupportLinks />
        </AsidePadding>
      </Aside>
    </Page>
  );
};

export default CreateErrorPage;
