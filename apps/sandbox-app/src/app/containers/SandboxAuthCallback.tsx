import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { AppDispatch, configInitializedSelector, initializeTenant, tenantSelector, userSelector } from '../state';

function getUrlParams(url = window.location.href) {
  const { searchParams, pathname } = new URL(url);

  // Query string params: ?foo=bar&baz=qux
  const query = Object.fromEntries(searchParams.entries());

  // Path segments: ['autotest'] or ['autotest', '1--upload-submission']
  const segments = pathname.split('/').filter(Boolean);

  return { query, segments };
}

export const SandboxAuthCallback = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const from = params.get('from');

  // Tenant name is the first path segment of the 'from' URL (e.g. /my-tenant/...)
  const tenantName = from?.split('/')?.[1].replace('/', '');
  console.log('tenantName', tenantName);

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
