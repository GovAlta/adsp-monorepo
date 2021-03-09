import React, { useEffect } from 'react';
import Header from '../../header';
import { useSelector, useDispatch } from 'react-redux';
import { TYPES, tenant } from '../../store/actions';
import { Redirect } from 'react-router-dom';
import { RootState } from '../../store/reducers';
import UserService from '../../service/userSevice';

function LoginSSO() {
  const isAuthenticated = useSelector((state: RootState) => state.user.authenticated);

  const tenentName = useSelector((state: RootState) => state.tenant.tenant.name);
  const dispatch = useDispatch();

  const loginHandler = (keycloak) => {
    if (keycloak.realm) {
      dispatch(tenant.getTenantInfo(keycloak.realm));
    }
    if (tenentName !== null) {
      dispatch({ type: TYPES.USER_LOGIN_SUCCESS, keycloak });
    } else {
      //  TODO: need UI design
      alert('Get tenant name Failed');
    }
  };
  const loginFailed = () => {
    // TODO: need UI design
    alert('Login Failed');
  };

  const login = () => {
    // TODO: Add error handling if the keycloak server is down.

    // Get token to check is tenant exist in db
    // if yes, login sucessful otherwise login failed.
    UserService.login(loginHandler, loginFailed);
  };

  useEffect(login);

  if (isAuthenticated) {
    if (tenentName === null) {
      return <Redirect to="/Realms/CreateRealm" />;
    }
    return <Redirect to="/tenant-admin" />;
  }

  return (
    <div>
      <Header isLoginLink={false} />
    </div>
  );
}

export default LoginSSO;
