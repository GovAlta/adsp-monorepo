import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoAButton, GoAButtonGroup, GoACallout } from '@abgov/react-components-new';
import { useLocation } from 'react-router-dom';
import { AppDispatch, loginUser, tenantSelector, userSelector } from '../state';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

/**
 * Parse the route path to retrieve the form definitionId.
 * Need to use this approach because the current routing setup passes the
 * form definition id as a '*' as the key and we cant use 'the useParams' hook to retrieve it directly.
 * Eg: 'http://host/tenant/myForm/' or 'http://host/tenant/myForm'
 * @param location path
 * @returns the form definition id
 */
const getDefinitionId = (path: string) => {
  let routePath = path;
  if (routePath.endsWith('/')) {
    routePath = routePath.slice(0, routePath.length - 1);
  }

  routePath = routePath.split('/').at(-1);
  return routePath;
};

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
  const definitionId = getDefinitionId(location.pathname);
  const { user } = useSelector(userSelector);

  const onSignInStartApplication = () => {
    dispatch(loginUser({ tenant, from: `${location.pathname}?autoCreate=true` }));
  };

  return (
    <div>
      <Band title="Sign in to apply">Sign in to start or continue an application for {definitionId}</Band>
      <Container vs={3} hs={1}>
        <Grid>
          <GridItem md={1} />
          <GridItem md={10}>
            <div>
              {!roles?.length || roles.find((r) => user.roles?.includes(r)) ? (
                <Placeholder>
                  <GoACallout heading="Not authorized" type="information">
                    Sign in {roles?.length ? 'as a user with a permitted role' : ''} for access.
                  </GoACallout>
                </Placeholder>
              ) : null}
              <GoAButtonGroup alignment="end">
                <GoAButton type="primary" onClick={onSignInStartApplication}>
                  Sign in
                </GoAButton>
              </GoAButtonGroup>
            </div>
          </GridItem>
          <GridItem md={1} />
        </Grid>
      </Container>
    </div>
  );
};
