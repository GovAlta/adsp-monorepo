import { GoAAppHeader, GoAButton, GoAMicrositeHeader } from '@abgov/react-components';
import { EditorWrapper } from './Editor';
import Dashboard from './dashboard';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  configInitializedSelector,

  initializeTenant,
  logoutUser,
  tenantSelector,
  userSelector,
} from '../../state';
//import { FeedbackNotification } from '../FeedbackNotification';

//import { useFeedbackLinkHandler } from '../util/feedbackUtils';


const AccountActionsDiv = styled.div`
  align-content: center;
  text-align: center;
  padding: var(--goa-space-xs) 0;
`;

export const TenantManagement = () => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const tenant = useSelector(tenantSelector);
  //const userSelector = useSelector(userSelector);


  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized, user } = useSelector(userSelector);

  useEffect(() => {
    if (configInitialized && tenantName) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);




  return (
    <React.Fragment>
      <main>
        {userInitialized && (
          <section>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/edit/:id" element={<EditorWrapper />} />
            </Routes>
          </section>
        )}
      </main>
    </React.Fragment>
  );
};
export default TenantManagement;