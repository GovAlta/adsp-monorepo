import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AppDispatch, configInitializedSelector, tenantSelector, userSelector } from '../state';
import { DEFAULT_TENANT, useFeedbackLinkHandler } from '../util/feedbackUtils';
import { Band } from '@core-services/app-common';
import { SignIn } from './SignIn';
import PDFServiceMain from './services/AgentServiceMain';
import AgentServiceMain from './services/AgentServiceMain';
import FormServiceMain from './services/FormServiceMain';
import NotificationServiceMain from './services/NotificationServiceMain';
import Header from './Header';
import FeedbackServiceMain from './services/FeedbackServiceMain';
import JsonformsMain from './services/JsonformsMain';
import { useAdspFeedbackWidget } from '../util/useFeedbackWidget';
import StatusServiceMain from './services/StatusServiceMain';

export const SandBoxTenant = () => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const tenant = useSelector(tenantSelector);

  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized, user } = useSelector(userSelector);

  useAdspFeedbackWidget();
  return (
    <React.Fragment>
      <Header />

      <main>
        {!user && location.pathname.endsWith(DEFAULT_TENANT) ? (
          <SignIn />
        ) : (
          <section>
            <Band title="Sandbox services">Services available for POC</Band>
            <Routes>
              <Route path="/services/agent" element={<AgentServiceMain />} />
              <Route path="/services/form" element={<FormServiceMain />} />
              <Route path="/services/feedback" element={<FeedbackServiceMain />} />
              <Route path="/services/jsonforms" element={<JsonformsMain />} />
              <Route path="/services/notification" element={<NotificationServiceMain />} />
              <Route path="/services/pdf" element={<PDFServiceMain />} />
              <Route path="/services/status" element={<StatusServiceMain />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/" element={<Navigate to={`/${tenantName}`} replace />} />
            </Routes>
          </section>
        )}
      </main>
    </React.Fragment>
  );
};
