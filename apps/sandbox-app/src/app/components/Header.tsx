import { GoabAppHeader, GoabButton, GoabMicrositeHeader } from '@abgov/react-components';
import React, { useEffect } from 'react';
import { AccountActionsDiv } from './styled-components';
import { dispatch } from '@abgov/ui-components-common';
import { useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  configInitializedSelector,
  initializeTenant,
  logoutUser,
  tenantSelector,
  userSelector,
} from '../state';

export default function Header() {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const tenant = useSelector(tenantSelector);
  const { initialized: userInitialized, user } = useSelector(userSelector);
  const configInitialized = useSelector(configInitializedSelector);

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  return (
    <>
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" />
      <GoabAppHeader url="/" heading={'Alberta Digital Service Platform - Sandbox app'}>
        <>
          <span style={{ display: 'none' }}></span>
          {userInitialized && user && (
            <AccountActionsDiv>
              {
                <>
                  <span className="username">{user?.name}</span>
                  <GoabButton
                    ml="s"
                    type="tertiary"
                    data-testid="sandbox  -sign-out"
                    onClick={() => {
                      if (tenant && tenant.name) {
                        dispatch(logoutUser({ tenant, from: `/${tenant.name}` }));
                      } else {
                        dispatch(logoutUser({ tenant, from: `${location.pathname}` }));
                      }
                    }}
                  >
                    Sign out
                  </GoabButton>
                </>
              }
            </AccountActionsDiv>
          )}
        </>
      </GoabAppHeader>
    </>
  );
}
