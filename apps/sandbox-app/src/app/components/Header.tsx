import { GoabAppHeader, GoabButton, GoabMicrositeHeader } from '@abgov/react-components';
import React, { useEffect } from 'react';
import { AccountActionsDiv } from './styled-components';
import { useLocation, useParams } from 'react-router-dom-v7';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  configInitializedSelector,
  initializeTenant,
  logoutUser,
  sessionKeepAliveSelector,
  tenantSelector,
  userSelector,
} from '../state';
import styled from 'styled-components';
import { useSessionRefresh } from '../hooks/useSessionRefresh';
import { SessionExpiryModal } from './SessionExpiryModal';

const UserSpan = styled.span`
  margin-left: var(--goa-space-l);
  margin-right: var(--goa-space-xs);
`;

export default function Header() {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const tenant = useSelector(tenantSelector);
  const { initialized: userInitialized, user } = useSelector(userSelector);
  const configInitialized = useSelector(configInitializedSelector);
  const keepSessionAlive = useSelector(sessionKeepAliveSelector);
  const signedIn = userInitialized && !!user;

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  useSessionRefresh(signedIn);

  const signOut = () => {
    if (tenant && tenant.name) {
      dispatch(logoutUser({ tenant, from: `/${tenant.name}` }));
    } else {
      dispatch(logoutUser({ tenant, from: `${location.pathname}` }));
    }
  };

  return (
    <>
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" />
      <GoabAppHeader url="/" heading={'Alberta Digital Service Platform - Sandbox app'}>
        <AccountActionsDiv slot="utilities">
          {signedIn && (
            <span>
              <UserSpan>{user.name}</UserSpan>
              <GoabButton size="compact" mt="s" mr="s" type="tertiary" onClick={signOut}>
                Sign out
              </GoabButton>
            </span>
          )}
        </AccountActionsDiv>
      </GoabAppHeader>
      {signedIn && !keepSessionAlive && <SessionExpiryModal onSignOut={signOut} />}
    </>
  );
}
