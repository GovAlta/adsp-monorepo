import React from 'react';
import { GoAButton } from '@abgov/react-components';
import { useDispatch } from 'react-redux';
import { Page, Main } from '@components/Html';
import GoALinkButton from '@components/LinkButton';
import { TenantCreationLoginInit } from '@store/tenant/actions';

const GetStarted = () => {
  const dispatch = useDispatch();

  return (
    <Page>
      <Main>
        <h2>Let's get you signed in</h2>
        <p>
          Currently, the Alberta Digital Service Platform only uses the Government of Alberta's account as
          authentication, with plans to expand to other federated login providers in the future.
        </p>
        <>
          <GoAButton
            buttonType="primary"
            onClick={() => {
              dispatch(TenantCreationLoginInit());
            }}
          >
            Continue with Government Alberta account
          </GoAButton>
          <GoALinkButton buttonType="secondary" to="/">
            Back to main page
          </GoALinkButton>
        </>
      </Main>
    </Page>
  );
};

export default GetStarted;
