import { Navigate, useLocation } from 'react-router-dom';

export const AuthCallback = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const from = params.get('from');

  return <Navigate to={from as string} replace />;
};
