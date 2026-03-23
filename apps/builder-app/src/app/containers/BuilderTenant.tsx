import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import {
  AppDispatch,
  configInitializedSelector,
  initializeTenant,
  loginUser,
  logoutUser,
  tenantSelector,
  userSelector,
} from '../state';

export const BuilderTenant = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { tenant: tenantName } = useParams<{ tenant: string }>();

  const configInitialized = useSelector(configInitializedSelector);
  const tenant = useSelector(tenantSelector);
  const user = useSelector(userSelector);

  useEffect(() => {
    if (configInitialized && tenantName) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, dispatch, tenantName]);

  return (
    <main style={{ padding: '2rem' }}>
      <h2>Builder workspace</h2>
      <p>Tenant: {tenant?.name ?? tenantName ?? 'Unknown'}</p>
      <p>Signed in user: {user?.email ?? 'Not signed in'}</p>
      <p>
        <a href="/">Back to landing page</a>
      </p>
      {!user && tenant ? (
        <button onClick={() => dispatch(loginUser({ tenant, from: location.pathname }))}>Sign in</button>
      ) : null}
      {user && tenant ? (
        <button onClick={() => dispatch(logoutUser({ tenant, from: location.pathname }))}>Sign out</button>
      ) : null}
    </main>
  );
};
