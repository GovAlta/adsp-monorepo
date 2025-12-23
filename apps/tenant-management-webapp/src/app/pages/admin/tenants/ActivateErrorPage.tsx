import React from 'react';
import { GoabButton } from '@abgov/react-components';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';

const CreateErrorPage = (): JSX.Element => {
  return (
    <Page>
      <Main>
        <p>We apologize for the inconvenience, but we could not successfully activate your tenant. Please try again.</p>
        <GoabButton>Activate Tenant</GoabButton>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};

export default CreateErrorPage;
