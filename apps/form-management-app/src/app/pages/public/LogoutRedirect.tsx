import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutRedirect = (): JSX.Element => {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.removeItem('realm');
    localStorage.removeItem('idpFromUrl');
    navigate('/');
  }, [navigate]);

  return <div></div>;
};

export default LogoutRedirect;
