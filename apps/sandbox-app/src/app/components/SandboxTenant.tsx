import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import {
  AppDispatch,
  configInitializedSelector,
  formSelector,
  initializeTenant,
  initializeUser,
  loginUser,
  logoutUser,
  tenantSelector,
  userSelector,
} from '../state';
import { GoabAppHeader, GoabButton, GoabButtonGroup, GoabMicrositeHeader } from '@abgov/react-components';
import styled from 'styled-components';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';
import Services from './Services';
import { Band, Grid, GridItem } from '@core-services/app-common';
import { SignIn } from './SignIn';
import PDFService from './services/PDFService';

const AccountActionsDiv = styled.div`
  align-content: center;
  text-align: center;
  padding: var(--goa-space-xs) 0;
`;

export const SandBoxTenant = () => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const tenant = useSelector(tenantSelector);

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
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoabAppHeader url="/" heading={'Alberta Digital Service Platform - Sandbox app'}>
        <>
          <span style={{ display: 'none' }}></span>
          {userInitialized && (
            <AccountActionsDiv>
              {userInitialized && user && (
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
              )}
            </AccountActionsDiv>
          )}
        </>
      </GoabAppHeader>

      <main>
        {!user ? <SignIn /> : null}
        {user && (
          <section>
            <Band title="Sandbox services">Services available for POC</Band>
            <Routes>
              <Route path="/services" element={<Services />} />
              <Route path="/services/pdf" element={<PDFService />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/" element={<Navigate to={`/${tenantName}`} replace />} />
            </Routes>
          </section>
        )}
      </main>
    </React.Fragment>
  );
};
