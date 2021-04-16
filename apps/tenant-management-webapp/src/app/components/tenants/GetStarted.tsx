import React, { useContext } from 'react';
import { GoAButton } from '@abgov/react-components';
import AuthContext from '@lib/authContext';
import { Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Page, Main } from '@components/_/Html';
import GoALinkButton from '@components/_/LinkButton';
import Container from '@components/_/Container';
import { Grid, GridItem } from '@components/_/Grid';
import Header from '@components/appHeader';

const GetStarted = () => {
  const { signIn } = useContext(AuthContext);
  const { authenticated } = useSelector((state: RootState) => ({
    authenticated: state.session.authenticated,
  }));

  return (
    <div>
      <Header serviceName="" hasLoginLink={false} />
      <Page>
        <Main>
          <br />
          <h1>
            <b> Let's get you signed in</b>
          </h1>
          <h3>
            Currently, the Alberta Digital Service Platform only uses the Government of Alberta's account as
            authentication, with plans to expand to other federated login providers in the future.
          </h3>

          {!authenticated ? (
            <>
              <GoAButton buttonType="primary" onClick={() => signIn('/tenants/start')}>
                Continue with Government Alberta account
              </GoAButton>

              <GoALinkButton buttonType="secondary" to="/">
                Back to main page
              </GoALinkButton>
            </>
          ) : (
            <Redirect to="/tenants/create" />
          )}
        </Main>
      </Page>
    </div>
  );
};

export default GetStarted;
