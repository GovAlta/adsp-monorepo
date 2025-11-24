import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (configInitialized && tenantName) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  useEffect(() => {
    if (tenant) {
      dispatch(loginUser({ tenant, from: `/${tenantName}` }));
    }
  }, [tenant, dispatch, tenantName]);

  useEffect(() => {
    if (feedback?.message.includes('not found')) {
      // Handle tenant not found case - could redirect to error page or home
      console.warn('Tenant not found');
    }
  }, [feedback, navigate]);

  return <div></div>;
};

export default LoginLanding;
