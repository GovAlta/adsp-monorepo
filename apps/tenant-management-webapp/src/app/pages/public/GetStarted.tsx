import React from 'react';
import { GoAButton } from '@abgov/react-components-new';
import { useDispatch } from 'react-redux';
import { Page, Main } from '@components/Html';
import GoALinkButton from '@components/LinkButton';
import { TenantCreationLoginInit } from '@store/tenant/actions';
import { GoAFormActions } from '@abgov/react-components/experimental';
import { getIdpHint } from '@lib/keycloak';

const GetStarted = (): JSX.Element => {
  const dispatch = useDispatch();

  return (
    <Page>
      <Main>
        <h1>Let's get you signed in</h1>
        <p>
          Currently, the Alberta Digital Service Platform only uses the Government of Alberta's account as
          authentication, with plans to expand to other federated login providers in the future.
        </p>
        <GoAFormActions alignment="left">
          <GoAButton
            type="primary"
            onClick={() => {
              const idpHint = getIdpHint();
              dispatch(TenantCreationLoginInit(idpHint));
            }}
          >
            Sign in
          </GoAButton>

          <GoALinkButton buttonType="secondary" to="/">
            Back to main page
          </GoALinkButton>
        </GoAFormActions>
      </Main>
    </Page>
  );
};

export default GetStarted;
