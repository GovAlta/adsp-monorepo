import { GoabAppHeader, GoabButton, GoabMicrositeHeader } from '@abgov/react-components';
import { useScripts } from '@core-services/app-common';
import React, { Suspense, lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useParams, useNavigate } from 'react-router-dom';

import {
  AppDispatch,
  configInitializedSelector,
  extensionsSelector,
  initializeTenant,
  loadExtensions,
  loginUser,
  logoutUser,
  tenantSelector,
  userSelector,
  feedbackSelector,
} from '../state';
import { FeedbackNotification } from './FeedbackNotification';
import { AuthorizeUser } from './AuthorizeUser';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';

const TaskQueue = lazy(() => import('./TaskQueue'));
const TaskQueues = lazy(() => import('./TaskQueues'));

interface TaskTenantSectionProps {
  tenantName: string;
}

const TaskTenantSection = ({ tenantName }: TaskTenantSectionProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const tenant = useSelector(tenantSelector);
  useEffect(() => {
    dispatch(loadExtensions(tenant.id));
  }, [dispatch, tenant]);

  return (
    <section>
      <Routes>
        <Route
          path={`/:namespace/:name/*`}
          element={
            <Suspense>
              <TaskQueue />
            </Suspense>
          }
        />
        <Route
          path="/"
          element={
            <Suspense>
              <TaskQueues />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to={`/${tenantName}`} replace />} />
      </Routes>
    </section>
  );
};

export const TaskTenant = () => {
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
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoabAppHeader url="/" heading={`${tenant?.name || tenantName} - Task management`}>
        {userInitialized && (
          <span>
            <span>{user?.name}</span>
            {user ? (
              <GoabButton
                mt="s"
                mr="s"
                type="tertiary"
                onClick={() => dispatch(logoutUser({ tenant, from: `${location.pathname}?logout=true` }))}
              >
                Sign out
              </GoabButton>
            ) : (
              <GoabButton
                mt="s"
                mr="s"
                type="tertiary"
                onClick={() => dispatch(loginUser({ tenant, from: location.pathname }))}
              >
                Sign in
              </GoabButton>
            )}
          </span>
        )}
      </GoabAppHeader>
      <FeedbackNotification />
      <main>
        <AuthorizeUser>
          <TaskTenantSection tenantName={tenantName} />
        </AuthorizeUser>
      </main>
    </React.Fragment>
  );
};
