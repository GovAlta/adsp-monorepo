import React from 'react';
import { GoAButton, GoAButtonGroup } from '@abgov/react-components';
import { useDispatch } from 'react-redux';
import { Page, Main } from '@components/Html';
import GoALinkButton from '@components/LinkButton';
import { TenantCreationLoginInit } from '@store/tenant/actions';
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
        <GoAButtonGroup alignment="start">
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
        </GoAButtonGroup>
      </Main>
    </Page>
  );
};

export default GetStarted;
