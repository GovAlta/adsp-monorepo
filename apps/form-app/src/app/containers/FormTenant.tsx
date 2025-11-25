import { GoAAppHeader, GoAButton, GoAMicrositeHeader } from '@abgov/react-components';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  configInitializedSelector,
  formSelector,
  initializeTenant,
  logoutUser,
  tenantSelector,
  userSelector,
} from '../state';
import { FeedbackNotification } from './FeedbackNotification';
import { FormDefinition } from './FormDefinition';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';
import { Forms } from './Forms';

const AccountActionsDiv = styled.div`
  align-content: center;
  text-align: center;
  padding: var(--goa-space-xs) 0;
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
  useFeedbackLinkHandler();

  return (
    <React.Fragment>
      <GoAMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoAAppHeader url="/" heading={`${tenant?.name || tenantName} - Form`}>
        <>
          <pre>user: {JSON.stringify(user)}</pre>
          <span style={{ display: 'none' }}></span>
 
          {userInitialized && (
            <AccountActionsDiv>
              {user && (
                <>
                  <span className="username">{user?.name}</span>
                  <GoAButton
                    ml="s"
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
              )}
            </AccountActionsDiv>
          )}
        </>
      </GoAAppHeader>
      <FeedbackNotification />
      <main>
        {userInitialized && (
          <section>
            <Routes>
              <Route path="/forms" element={<Forms />} />
              <Route path="/:definitionId/*" element={<FormDefinition />} />
              <Route path="/" element={<Navigate to="forms" />} />
            </Routes>
          </section>
        )}
      </main>
    </React.Fragment>
  );
};
