import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom-6';

const LogoutRedirect = (): JSX.Element => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, []);

  return <div></div>;
};

export default LogoutRedirect;
