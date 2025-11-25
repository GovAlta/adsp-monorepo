import { Navigate, useLocation } from 'react-router-dom';

export const AuthCallback = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  console.log(JSON.stringify(search) + "<search");
  const from = params.get('from');

    console.log(JSON.stringify(from) + '<from');

  return <Navigate to={from as string} replace />;
};
