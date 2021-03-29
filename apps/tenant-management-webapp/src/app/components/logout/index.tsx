import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { TenantLogout } from '../../store/tenant/actions';
import { SessionLogout } from '../../store/session/actions';
import { ConfigLogout } from '../../store/config/actions';

function Logout() {
  const dispatch = useDispatch();

  const logout = () => {
    dispatch(SessionLogout());
    dispatch(TenantLogout());
    dispatch(ConfigLogout());
  };

  useEffect(logout, [dispatch, SessionLogout, TenantLogout, ConfigLogout]);
  return (
    <div>
      <Link to="/" style={{ margin: '100px 200px 100px 40px' }}>
        Back to home page
      </Link>
    </div>
  );
}

export default Logout;
