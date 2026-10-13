import { Navigate, useLocation } from 'react-router-dom-v7';

/**
 * This a temporary component to support react router dom update to version 7
 * So that we wont impact other downstream references of the Authcallback.tsx file.
 * This will be removed once the update for react router dom to version 7 is completed
 */
export const AuthCallbackV2 = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const from = params.get('from');

  return <Navigate to={from as string} replace />;
};
