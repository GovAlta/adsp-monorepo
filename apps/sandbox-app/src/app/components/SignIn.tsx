import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { FunctionComponent } from 'react';
import { GoabButton, GoabButtonGroup, GoabCallout } from '@abgov/react-components';
import { useLocation } from 'react-router-dom';
import { AppDispatch, configInitializedSelector, loginUser, tenantSelector, userSelector } from '../state';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { useAdspFeedbackWidget } from '../util/useFeedbackWidget';

const Placeholder = styled.div`
  padding: 48px;
`;

interface SignInProps {
  roles?: string[];
}

export const SignIn: FunctionComponent<SignInProps> = ({ roles }) => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const tenant = useSelector(tenantSelector);
  const { initialized: userInitialized, user } = useSelector(userSelector);
  const configInitialized = useSelector(configInitializedSelector);

  const onSignInStart = () => {
    dispatch(loginUser({ tenant, from: `${location.pathname}/services` }));
  };

  useAdspFeedbackWidget();
  return (
    <div>
      <Band title="Sandbox services">Services available</Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <div>
              {!userInitialized && !user && configInitialized ? (
                <Placeholder>
                  <GoabCallout heading="Not authorized" type="information">
                    You do not have a permitted role to access this sandbox.
                  </GoabCallout>
                </Placeholder>
              ) : null}
              <GoabButtonGroup alignment="end">
                <GoabButton type="primary" data-testid="sandbox-start-application-sign-in" onClick={onSignInStart}>
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
