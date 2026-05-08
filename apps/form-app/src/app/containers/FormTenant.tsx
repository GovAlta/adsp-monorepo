import { GoabAppHeader, GoabButton, GoabMicrositeHeader } from '@abgov/react-components';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  configInitializedSelector,
  definitionSelector,
  formSelector,
  initializeTenant,
  logoutUser,
  selectedDefinition,
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
  const urlParams = new URLSearchParams(location.search);
  const dispatch = useDispatch<AppDispatch>();
  const tenant = useSelector(tenantSelector);
  const userForm = useSelector(formSelector);

  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized, user } = useSelector(userSelector);
  const { definitionId } = useParams();

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  const version = urlParams.get('version');

  useEffect(() => {
    if (tenant) {
      console.log('Selecting definition', { definitionId, version, tenant: tenant.name });
      dispatch(selectedDefinition({ definitionId, version }));
    }
  }, [dispatch, definitionId, version, tenant]);
  useFeedbackLinkHandler();

  const { definition } = useSelector(definitionSelector);

  return (
    <React.Fragment>
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoabAppHeader url="/" heading={definition?.uiSchema?.options?.mainTitle || definition?.name}>
        <>
          <span style={{ display: 'none' }}></span>
          {userInitialized && (
            <AccountActionsDiv>
              {user && (
                <>
                  <span className="username">{user?.name}</span>
                  <GoabButton
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
                  </GoabButton>
                </>
              )}
            </AccountActionsDiv>
          )}
        </>
      </GoabAppHeader>
      <FeedbackNotification />
      xxxxxxxxxxx
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
