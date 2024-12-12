import { GoAAppHeader, GoAButton, GoAMicrositeHeader } from '@abgov/react-components-new';
import { useScripts } from '@core-services/app-common';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  AppDispatch,
  configInitializedSelector,
  extensionsSelector,
  initializeTenant,
  loginUser,
  logoutUser,
  tenantSelector,
  userSelector,
  feedbackSelector,
} from '../state';
import { FeedbackNotification } from './FeedbackNotification';
import { AuthorizeUser } from './AuthorizeUser';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';
import { FormDefinition } from './FormDefinition';

export const FormAdminTenant = () => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
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
  const { initialized: userInitialized, user } = useSelector(userSelector);

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  return (
    <React.Fragment>
      <GoAMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoAAppHeader url="/" heading={`${tenant?.name || tenantName} - Form administration`}>
        {userInitialized && (
          <span>
            <span>{user?.name}</span>
            {user ? (
              <GoAButton
                mt="s"
                mr="s"
                type="tertiary"
                onClick={() => dispatch(logoutUser({ tenant, from: `${location.pathname}?logout=true` }))}
              >
                Sign out
              </GoAButton>
            ) : (
              <GoAButton
                mt="s"
                mr="s"
                type="tertiary"
                onClick={() => dispatch(loginUser({ tenant, from: location.pathname }))}
              >
                Sign in
              </GoAButton>
            )}
          </span>
        )}
      </GoAAppHeader>
      <FeedbackNotification />
      <main>
        <AuthorizeUser>
          <section>
            <Routes>
              <Route path="/:definitionId/*" element={<FormDefinition />} />
            </Routes>
          </section>
        </AuthorizeUser>
      </main>
    </React.Fragment>
  );
};
