import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const LogoutRedirect = (): JSX.Element => {
  const history = useHistory();
  useEffect(() => {
    localStorage.removeItem('realm');
    history.push('/');
  }, [history]);

  return <div></div>;
};

export default LogoutRedirect;
