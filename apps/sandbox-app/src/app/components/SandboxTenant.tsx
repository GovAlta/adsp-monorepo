import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AppDispatch,
  authenticatedUserSelector,
  configInitializedSelector,
  environmentSelector,
  initializeTenant,
} from '../state';

import { Band } from '@core-services/app-common';
import { SignIn } from './SignIn';

import Header from './Header';
import { useFeedbackWidget } from '../hooks/useFeedbackWidget';
import { FormServiceMain } from './services/FormServiceMain';
import { AgentServiceMain } from './services/AgentServiceMain';
import { FeedbackServiceMain } from './services/FeedbackServiceMain';
import { NotificationServiceMain } from './services/NotificationServiceMain';
import { PDFServiceMain } from './services/PDFServiceMain';
import { JsonformsMain } from './services/JsonformsMain';
import { StatusServiceMain } from './services/StatusServiceMain';
import { ValueServiceMain } from './services/ValueServiceMain';
import { TaskServiceMain } from './services/TaskServiceMain';
import { FileServiceMain } from './services/FileServiceMain';
import { GoabAppFooter, GoabButton, GoabButtonGroup, GoabCircularProgress } from '@abgov/react-components';
import { ScriptServiceMain } from './services/ScriptServiceMain';
import { CacheServiceMain } from './services/CacheServiceMain';
import { DirectoryServiceMain } from './services/DirectoryServiceMain';
import { CalendarServiceMain } from './services/CalendarServiceMain';
import { SharepointServiceMain } from './services/SharepointServiceMain';
import { EventServiceMain } from './services/EventServiceMain';
import { ConfigurationServiceMain } from './services/ConfigurationServiceMain';
import { FeedbackCSSLeak } from './services/feedback/FeedbackCSSLeak';
import { JsonformsExampleOne } from './services/jsonforms/JsonformsExampleOne';
import { DesignSystemsMain } from './services/DesignSystemsMain';
import { DesignSystemsExampleOne } from './services/design-systems/DesignSystemsExampleOne';
import { FeedbackNotification } from './FeedbackNotification';

export const SandBoxTenant = () => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const authenticatedUser = useSelector(authenticatedUserSelector);
  const configInitialized = useSelector(configInitializedSelector);

  const environment = useSelector(environmentSelector);

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, dispatch, tenantName]);

  useEffect(() => {
    if (authenticatedUser && location.pathname.endsWith(`/${environment.tenantName}`)) {
      navigate(`/${environment.tenantName}/services`);
    }
  }, [authenticatedUser, environment.tenantName, location.pathname, navigate]);

  useFeedbackWidget(environment.tenantName);
  return (
    <React.Fragment>
      <Header />
      <FeedbackNotification />
      <main>
        {authenticatedUser === null ? (
          <SignIn />
        ) : (
          authenticatedUser && (
            <section>
              <Band title="Sandbox services">Services/libraries available for POC</Band>
              {authenticatedUser && !location.pathname.endsWith(`${environment.tenantName}`) && (
                <GoabButtonGroup alignment="end" mr={'xl'} mt="l">
                  <GoabButton
                    type="tertiary"
                    onClick={() => {
                      navigate(`/${tenantName}/services`);
                    }}
                  >
                    Back to services
                  </GoabButton>
                </GoabButtonGroup>
              )}
              <Routes>
                <Route path="/services/agent" element={<AgentServiceMain tenantName={tenantName} />} />
                <Route path="/services/cache" element={<CacheServiceMain tenantName={tenantName} />} />
                <Route path="/services/calendar" element={<CalendarServiceMain tenantName={tenantName} />} />
                <Route path="/services/configuration" element={<ConfigurationServiceMain tenantName={tenantName} />} />
                <Route path="/services/directory" element={<DirectoryServiceMain tenantName={tenantName} />} />

                <Route path="/services/design-systems" element={<DesignSystemsMain tenantName={tenantName} />} />
                <Route path="/services/design-systems/example1" element={<DesignSystemsExampleOne />} />

                <Route path="/services/event" element={<EventServiceMain tenantName={tenantName} />} />
                <Route path="/services/file" element={<FileServiceMain tenantName={tenantName} />} />
                <Route path="/services/form" element={<FormServiceMain tenantName={tenantName} />} />

                <Route path="/services/feedback" element={<FeedbackServiceMain tenantName={tenantName} />} />
                <Route path="/services/feedback/cssleak" element={<FeedbackCSSLeak />} />

                <Route path="/services/jsonforms" element={<JsonformsMain tenantName={tenantName} />} />
                <Route path="/services/jsonforms/example1/:definitionId" element={<JsonformsExampleOne />} />

                <Route path="/services/notification" element={<NotificationServiceMain tenantName={tenantName} />} />
                <Route path="/services/pdf" element={<PDFServiceMain tenantName={tenantName} />} />
                <Route path="/services/script" element={<ScriptServiceMain tenantName={tenantName} />} />
                <Route path="/services/sharepoint" element={<SharepointServiceMain tenantName={tenantName} />} />
                <Route path="/services/status" element={<StatusServiceMain tenantName={tenantName} />} />
                <Route path="/services/task" element={<TaskServiceMain tenantName={tenantName} />} />
                <Route path="/services/value" element={<ValueServiceMain tenantName={tenantName} />} />

                <Route path="/signin" element={<SignIn />} />
                <Route path="/" element={<Navigate to={`/${tenantName}`} replace />} />
              </Routes>
            </section>
          )
        )}
      </main>
      <GoabAppFooter />
    </React.Fragment>
  );
};
