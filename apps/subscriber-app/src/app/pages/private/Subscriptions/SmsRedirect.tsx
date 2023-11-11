import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom-6';

const SmsRedirect = (): JSX.Element => {
  const { realm, code } = useParams<{ code: string; realm: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/subscriptions/${realm}?smscode=${code}`);
  }, []);

  return <div></div>;
};
export default SmsRedirect;
