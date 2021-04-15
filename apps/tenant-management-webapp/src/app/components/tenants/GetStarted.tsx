import React, { useContext } from 'react';
import { GoAButton } from '@abgov/react-components';
import AuthContext from '@lib/authContext';
import { Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Page, Main } from '@components/_/Html';
import GoALinkButton from '@components/_/LinkButton';

const GetStarted = () => {
  const { signIn } = useContext(AuthContext);
  const { authenticated } = useSelector((state: RootState) => ({
    authenticated: state.session.authenticated,
  }));

  return (
    <Page>
      <Main>
        <h2> Let's get you signed in </h2>
        <h3>
          Currently, the Alberta Digital Service Platform only uses the Government of Alberta's account as
          authentication, with plans to expand to other federated login providers in the future.
        </h3>

        {!authenticated ? (
          <>
            <GoALinkButton buttonType="secondary" to="/">
              Back to main page
            </GoALinkButton>
            <GoAButton buttonType="primary" onClick={() => signIn('/tenants/start')}>
              Continue with Government Alberta account
            </GoAButton>
          </>
        ) : (
          <Redirect to="/tenants/create" />
        )}
      </Main>
    </Page>
  );
};

export default GetStarted;
