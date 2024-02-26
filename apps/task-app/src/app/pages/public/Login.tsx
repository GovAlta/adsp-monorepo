import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom-6';

import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-6';

import {
  AppDispatch,
  configInitializedSelector,
  initializeTenant,
  loginUser,
  tenantSelector,
  feedbackSelector,
} from 'app/state';

const LoginLanding = (): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { tenant: tenantName } = useParams<{ tenant: string }>();

  const tenant = useSelector(tenantSelector);
  const feedback = useSelector(feedbackSelector);
  const configInitialized = useSelector(configInitializedSelector);

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  useEffect(() => {
    if (tenant) {
      dispatch(loginUser({ tenant, from: `/tasks/${tenantName}` }));
    }
  }, [tenant, dispatch, tenantName]);

  useEffect(() => {
    if (feedback?.message.includes('not found')) {
      navigate(`/overview`);
    }
  }, [feedback, navigate]);

  return <div></div>;
};

export default LoginLanding;
