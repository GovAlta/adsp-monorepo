import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { TYPES } from '../../store/actions';
import { Link } from 'react-router-dom';
import UserService from '../../service/userSevice';

function Logout() {
  const dispatch = useDispatch();
  const logout = () => {
    UserService.logout();
    dispatch({ type: TYPES.USER_LOGOUT });
  };
  useEffect(logout);
  return (
    <div>
      <Link to="/" style={{ margin: '100px 200px 100px 40px' }}>
        Back to home page
      </Link>
    </div>
  );
}

export default Logout;
