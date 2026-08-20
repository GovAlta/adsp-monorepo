import { GoabButton, GoabMicrositeHeader } from '@abgov/react-components';
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
  selectedTopicSelector,
  setShowMessages,
  showMessagesSelector,
  tenantSelector,
  unreadMessagesSelector,
  userSelector,
} from '../state';
import { FeedbackNotification } from './FeedbackNotification';
import { FormDefinition } from './FormDefinition';
import { FormHeader } from './FormHeader';
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
  const { definitionId } = useParams();

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  useEffect(() => {
    if (tenant) {
      dispatch(selectedDefinition(definitionId));
    }
  }, [dispatch, definitionId, tenant]);
  useFeedbackLinkHandler();

  const { definition } = useSelector(definitionSelector);
  const topic = useSelector(selectedTopicSelector);
  const showMessages = useSelector(showMessagesSelector);
  const unreadMessages = useSelector(unreadMessagesSelector);
  const headerTitle =
    definition?.uiSchema?.options?.mainTitle || definition?.name || 'Alberta Digital Service Platform - Form';

  return (
    <React.Fragment>
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <FormHeader
        heading={headerTitle}
        // The topic is only created for definitions with 'create support topic' checked, and only
        // once there is a form to raise questions about.
        showMessages={!!definition?.supportTopic && !!topic}
        unreadMessages={unreadMessages}
        onToggleMessages={() => dispatch(setShowMessages(!showMessages))}
      >
        {userInitialized && (
          <AccountActionsDiv>
            {user && (
              <>
                <span className="username">{user?.name}</span>
                <GoabButton
                  size="compact"
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
      </FormHeader>
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
