import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const LogoutRedirect = () => {
  const history = useHistory();
  useEffect(() => {
    localStorage.removeItem('realm');
    history.push('/');
  }, []);

  return <div></div>;
};

export default LogoutRedirect;
