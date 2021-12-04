import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const LogoutRedirect = (): JSX.Element => {
  const history = useHistory();
  useEffect(() => {
    history.push('/');
  }, []);

  return <div></div>;
};

export default LogoutRedirect;
