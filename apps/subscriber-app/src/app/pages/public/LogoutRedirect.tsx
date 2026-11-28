import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutRedirect = (): JSX.Element => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div></div>;
};

export default LogoutRedirect;
