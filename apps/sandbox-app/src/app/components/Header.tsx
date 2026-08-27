import { GoabAppHeader, GoabButton, GoabMicrositeHeader } from '@abgov/react-components';
import React, { useEffect } from 'react';
import { AccountActionsDiv } from './styled-components';
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
import styled from 'styled-components';

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

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  return (
    <>
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" />
      <GoabAppHeader url="/" heading={'Alberta Digital Service Platform - Sandbox app'}>
        <AccountActionsDiv slot="utilities">
          {userInitialized && user && (
            <span>
              <UserSpan>{user.name}</UserSpan>
              <GoabButton
                size="compact"
                mt="s"
                mr="s"
                type="tertiary"
                onClick={() => dispatch(logoutUser({ tenant, from: `${location.pathname}?logout=true` }))}
              >
                Sign out
              </GoabButton>
            </span>
          )}
        </AccountActionsDiv>
      </GoabAppHeader>
    </>
  );
}
