import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { useLocation } from 'react-router-dom';
import { AppDispatch, loginUser, tenantSelector } from '../state';
import { useDispatch, useSelector } from 'react-redux';

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

export const SignInStartApplication: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const tenant = useSelector(tenantSelector);
  const definitionId = getDefinitionId(location.pathname);

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
