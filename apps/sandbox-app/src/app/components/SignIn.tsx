import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { FunctionComponent, useEffect } from 'react';

import { GoabButton, GoabButtonGroup, GoabCallout, GoabCircularProgress } from '@abgov/react-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppDispatch, authenticatedUserSelector, environmentSelector, loginUser, tenantSelector } from '../state';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { CenteredProgress } from './styled-components';

const Placeholder = styled.div`
  padding: 48px;
`;

interface SignInProps {
  roles?: string[];
  url: string;
}

export const SignIn: FunctionComponent<SignInProps> = ({ url }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const location = useLocation();
  const from = (location.state as { from?: string })?.from;
  const tenant = useSelector(tenantSelector);
  const authenticatedUser = useSelector(authenticatedUserSelector);
  const environment = useSelector(environmentSelector);
  const isServicesUrl = (path: string): boolean => /\/services(\/.*)?$/.test(path);

  useEffect(() => {
    if (environment.tenantName && !location.pathname.includes(environment.tenantName)) {
      navigate('/', { state: { from } });
    }
  }, [environment.tenantName, location.pathname, navigate, from]);

  useEffect(() => {
    if (from && authenticatedUser === null) {
      dispatch(loginUser({ tenant, from }));
    }
  }, [from, authenticatedUser, dispatch, tenant]);

  const shouldShowSignInButton = () => {
    if (
      (environment && from && !from.includes(`${environment.tenantName}`)) ||
      !location.pathname.endsWith(`${environment.tenantName}`)
    )
      return false;

    return authenticatedUser === null && !from;
  };

  const onSignInStart = () => {
    if (!isServicesUrl(url)) {
      dispatch(loginUser({ tenant, from: `${location.pathname}/services` }));
    } else {
      dispatch(loginUser({ tenant, from: `${location.pathname}` }));
    }
  };

  return (
    <div>
      <Band title="Sandbox application">Sign in to the sandbox</Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <div>
              {!shouldShowSignInButton() && (
                <CenteredProgress>
                  <GoabCircularProgress variant="inline" size="large" message="Loading services..." visible={true} />
                </CenteredProgress>
              )}
              {authenticatedUser && authenticatedUser.roles.length === 0 && (
                <Placeholder>
                  <GoabCallout heading="Not authorized" type="information">
                    You do not have a permitted role to access this sandbox.
                  </GoabCallout>
                </Placeholder>
              )}
              {from && authenticatedUser === null && (
                <GoabCircularProgress variant="inline" size="large" message="Signing in..." visible={true} />
              )}
              {shouldShowSignInButton() && (
                <GoabButtonGroup alignment="end">
                  <GoabButton type="primary" data-testid="sandbox-sign-in" onClick={onSignInStart}>
                    Sign in
                  </GoabButton>
                </GoabButtonGroup>
              )}
            </div>
          </GridItem>
          <GridItem md={1} />
        </Grid>
      </Container>
    </div>
  );
};
