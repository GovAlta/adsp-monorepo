import React, { useContext } from 'react';
import Header from '@components/appHeader';
import { GoAButton } from '@abgov/react-components';
import AuthContext from '@lib/authContext';
import { useHistory, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import Container from '@components/_/Container';
import { Grid, GridItem } from '@components/_/Grid';

const GetStarted = () => {
  const history = useHistory();
  const { signIn } = useContext(AuthContext);
  const { authenticated } = useSelector((state: RootState) => ({
    authenticated: state.session.authenticated,
  }));

  return (
    <div>
      <Header hasLoginLink={false} />
      <Container>
        <h2> Let's get you signed in </h2>
        <h3>
          Currently, the Alberta Digital Service Platform only uses the Government of Alberta's account as
          authentication, with plans to expand to other federated login providers in the future.
        </h3>

        {!authenticated ? (
          <Grid>
            <GridItem md={5.5}>
              <GoAButton buttonType="primary" buttonSize="normal" onClick={() => signIn('/Realms/CreateRealm')}>
                Continue with Government Alberta account
              </GoAButton>
            </GridItem>
            <GridItem md={4}>
              <GoAButton buttonType="secondary" buttonSize="normal" onClick={() => history.push('/')}>
                Back to main page
              </GoAButton>
            </GridItem>
            <GridItem md={2.5}></GridItem>
          </Grid>
        ) : (
          <Redirect to="/Realms/CreateRealm" />
        )}
      </Container>
    </div>
  );
};

export default GetStarted;
