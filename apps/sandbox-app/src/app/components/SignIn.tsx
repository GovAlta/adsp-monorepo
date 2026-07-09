import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { FunctionComponent, memo } from 'react';
import { GoabButton, GoabButtonGroup, GoabCallout } from '@abgov/react-components';
import { useLocation } from 'react-router-dom';
import { AppDispatch, authenticatedUserSelector, loginUser, tenantSelector } from '../state';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

const Placeholder = styled.div`
  padding: 48px;
`;

interface SignInProps {
  roles?: string[];
}

export const SignIn: FunctionComponent<SignInProps> = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const tenant = useSelector(tenantSelector);
  const authenticatedUser = useSelector(authenticatedUserSelector);
  const onSignInStart = () => {
    dispatch(loginUser({ tenant, from: `${location.pathname}/services` }));
  };

  return (
    <div>
      <Band title="Sandbox application">Sign in to the sandbox</Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <div>
              {authenticatedUser && authenticatedUser.roles.length === 0 && (
                <Placeholder>
                  <GoabCallout heading="Not authorized" type="information">
                    You do not have a permitted role to access this sandbox.
                  </GoabCallout>
                </Placeholder>
              )}

              <GoabButtonGroup alignment="end">
                <GoabButton type="primary" data-testid="sandbox-start-sign-in" onClick={onSignInStart}>
                  Sign in
                </GoabButton>
              </GoabButtonGroup>
            </div>
          </GridItem>
          <GridItem md={1} />
        </Grid>
      </Container>
    </div>
  );
});
