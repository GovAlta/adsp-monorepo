import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';

import {
  AppDispatch,
  configInitializedSelector,
  initializeTenant,
  loginUser,
  tenantSelector,
  feedbackSelector,
} from '../../state';

const LoginLanding = (): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { tenant: tenantName } = useParams<{ tenant: string }>();

  const tenant = useSelector(tenantSelector);
  const feedback = useSelector(feedbackSelector);
  const configInitialized = useSelector(configInitializedSelector);

  // Prevent duplicated calls
  const didInitTenant = useRef(false);
  const didLogin = useRef(false);

  // STEP 1: Load tenant once config is ready
  useEffect(() => {
    if (!configInitialized) return;

    if (!didInitTenant.current) {
      didInitTenant.current = true;
      console.log('Initializing tenant:', tenantName);
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  // STEP 2: Log user in once tenant is loaded
  useEffect(() => {
    if (!tenant) return;

    if (!didLogin.current) {
      didLogin.current = true;
      console.log('Calling loginUser with tenant:', tenant);
      dispatch(loginUser({ tenant, from: `/${tenantName}` }));
    }
  }, [tenant, tenantName, dispatch]);

  // STEP 3: Tenant not found -> navigate away
  useEffect(() => {
    if (feedback?.message?.includes('not found')) {
      navigate(`/overview`);
    }
  }, [feedback, navigate]);

  return <div></div>;
};

export default LoginLanding;
