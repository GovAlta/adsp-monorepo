import { GoabAppHeader, GoabMicrositeHeader } from '@abgov/react-components';
import { useScripts } from '@core-services/app-common';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useParams, useNavigate, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  configInitializedSelector,
  extensionsSelector,
  initializeTenant,
  tenantSelector,
  feedbackSelector,
} from '../state';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';
import { AuthorizeUser } from './AuthorizeUser';
import { FeedbackNotification } from './FeedbackNotification';
import { FormsDefinitions } from './FormDefinitions';
import { FormDefinition } from './FormDefinition';
import { NavigationMenu } from './NavigationMenu';

const TenantMainContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
`;

export const FormAdminTenant = () => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const tenant = useSelector(tenantSelector);
  const extensions = useSelector(extensionsSelector);
  useFeedbackLinkHandler();
  useScripts(...extensions);
  const navigate = useNavigate();

  const feedback = useSelector(feedbackSelector);

  useEffect(() => {
    if (feedback?.message.includes('not found')) {
      navigate(`/overview`);
    }
  }, [feedback, navigate]);

  const configInitialized = useSelector(configInitializedSelector);

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  return (
    <React.Fragment>
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoabAppHeader url="/" heading={`${tenant?.name || tenantName} - Form administration`}>
        <NavigationMenu type="menu" />
      </GoabAppHeader>
      <FeedbackNotification />
      <AuthorizeUser>
        <TenantMainContainer>
          <NavigationMenu type="side" />
          <main>
            <section>
              <Routes>
                <Route path="/definitions/:definitionId/*" element={<FormDefinition />} />
                <Route path="/definitions" element={<FormsDefinitions />} />
                <Route path="*" element={<Navigate to="definitions" />} />
              </Routes>
            </section>
          </main>
        </TenantMainContainer>
      </AuthorizeUser>
    </React.Fragment>
  );
};
