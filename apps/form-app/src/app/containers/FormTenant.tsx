import { GoAAppHeader, GoAButton, GoAMicrositeHeader } from '@abgov/react-components-new';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  configInitializedSelector,
  formSelector,
  initializeTenant,
  loginUser,
  logoutUser,
  tenantSelector,
  userSelector,
} from '../state';
import { FeedbackNotification } from './FeedbackNotification';
import { FormDefinition } from './FormDefinition';

const AccountActionsSpan = styled.span`
  .username {
    @media (max-width: 639px) {
      display: none;
    }
  }
`;

export const FormTenant = () => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const tenant = useSelector(tenantSelector);
  const userForm = useSelector(formSelector);

  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized, user } = useSelector(userSelector);

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  return (
    <React.Fragment>
      <GoAMicrositeHeader type="alpha" />
      <GoAAppHeader url="/" heading={`${tenant?.name || tenantName} - Form`}>
        {userInitialized && (
          <AccountActionsSpan>
            {user ? (
              <>
                <span className="username">{user?.name}</span>
                <GoAButton
                  mt="s"
                  mr="s"
                  type="tertiary"
                  data-testid="form-sign-out"
                  onClick={() => {
                    if (userForm?.definition) {
                      dispatch(logoutUser({ tenant, from: `/${tenant.name}/${userForm.definition.id}` }));
                    } else {
                      dispatch(logoutUser({ tenant, from: `${location.pathname}` }));
                    }
                  }}
                >
                  Sign out
                </GoAButton>
              </>
            ) : (
              <GoAButton
                mt="s"
                mr="s"
                type="tertiary"
                data-testid="form-sign-in"
                onClick={() => {
                  dispatch(loginUser({ tenant, from: `${location.pathname}?autoCreate=true` }));
                }}
              >
                Sign in
              </GoAButton>
            )}
          </AccountActionsSpan>
        )}
      </GoAAppHeader>
      <FeedbackNotification />
      <main>
        {userInitialized && (
          <section>
            <Routes>
              <Route path={`/:definitionId/*`} element={<FormDefinition />} />
              <Route path="/" element={<div>{tenant?.name || tenantName}</div>} />
              <Route path="*" element={<Navigate to={`/${tenantName}`} replace />} />
            </Routes>
          </section>
        )}
      </main>
    </React.Fragment>
  );
};
