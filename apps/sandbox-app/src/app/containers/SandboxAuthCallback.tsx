import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { AppDispatch, configInitializedSelector, initializeTenant, tenantSelector, userSelector } from '../state';

export const SandboxAuthCallback = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const from = params.get('from');

  // Tenant name is the first path segment of the 'from' URL (e.g. /my-tenant/...)
  const tenantName = from?.split('/')?.[1].replace('/', '');

  const tenant = useSelector(tenantSelector);
  const dispatch = useDispatch<AppDispatch>();
  const configInitialized = useSelector(configInitializedSelector);
  const { initialized: userInitialized } = useSelector(userSelector);

  useEffect(() => {
    if (configInitialized && tenantName && !tenant) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, tenant, dispatch]);

  if (userInitialized) {
    return <Navigate to={from as string} replace />;
  }
  return null;
};
