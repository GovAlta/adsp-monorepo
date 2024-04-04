import { Navigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';

export const AuthCallback = () => {
  const { search } = useLocation();
  const { from } = queryString.parse(search);

  return <Navigate to={from as string} replace />;
};
