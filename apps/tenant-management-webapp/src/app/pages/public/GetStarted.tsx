import React, { useContext } from 'react';
import { GoAButton } from '@abgov/react-components';
import AuthContext from '@lib/authContext';
import { Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Page, Main } from '@components/Html';
import GoALinkButton from '@components/LinkButton';

const GetStarted = () => {
  const { signIn } = useContext(AuthContext);
  const { authenticated } = useSelector((state: RootState) => ({
    authenticated: state.session.authenticated,
  }));

  return (
    <Page>
      <Main>
        <h2>Let's get you signed in</h2>
        <p>
          Currently, the Alberta Digital Service Platform only uses the Government of Alberta's account as
          authentication, with plans to expand to other federated login providers in the future.
        </p>

        {!authenticated ? (
          <>
            <GoAButton buttonType="primary" onClick={() => signIn('/get-started')}>
              Continue with Government Alberta account
            </GoAButton>
            <GoALinkButton buttonType="secondary" to="/">
              Back to main page
            </GoALinkButton>
          </>
        ) : (
          <Redirect to="/admin/tenants/create" />
        )}
      </Main>
    </Page>
  );
};

export default GetStarted;
