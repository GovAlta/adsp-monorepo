import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { FunctionComponent } from 'react';
import { GoabButton, GoabButtonGroup, GoabCallout } from '@abgov/react-components';
import { useLocation } from 'react-router-dom';
import { AppDispatch, loginUser, tenantSelector, userSelector } from '../state';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

const Placeholder = styled.div`
  padding: 48px;
`;

interface SignInStartApplicationProps {
  roles?: string[];
}

export const SignInStartApplication: FunctionComponent<SignInStartApplicationProps> = ({ roles }) => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const tenant = useSelector(tenantSelector);
  const { user } = useSelector(userSelector);

  const onSignInStartApplication = () => {
    dispatch(loginUser({ tenant, from: `${location.pathname}?autoCreate=true` }));
  };

  return (
    <div>
      <Band title="Sign in to apply">Sign in to start or continue an application.</Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <div>
              {user || roles?.find((r) => user.roles?.includes(r)) ? (
                <Placeholder>
                  <GoabCallout heading="Not authorized" type="information">
                    You do not have a permitted role to access the form.
                  </GoabCallout>
                </Placeholder>
              ) : null}
              <GoabButtonGroup alignment="end">
                <GoabButton
                  type="primary"
                  data-testid="form-start-application-sign-in"
                  onClick={onSignInStartApplication}
                >
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
};
