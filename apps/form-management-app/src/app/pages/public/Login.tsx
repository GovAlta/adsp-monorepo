import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';

import { AppDispatch, configInitializedSelector, initializeTenant, loginUser, tenantSelector } from '../../state';

const LoginLanding = (): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { tenant: tenantName } = useParams<{ tenant: string }>();

  const tenant = useSelector(tenantSelector);
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

  return <div></div>;
};

export default LoginLanding;
