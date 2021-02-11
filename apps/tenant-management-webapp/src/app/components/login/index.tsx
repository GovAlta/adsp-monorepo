import React, { useEffect } from 'react';
import Header from '../../header';
import { useSelector, useDispatch } from 'react-redux';
import { TYPES } from '../../store/actions';
import * as _ from 'lodash';
import Keycloak from 'keycloak-js';
import { Redirect } from 'react-router-dom'


function Login() {

  const keycloakConfig = useSelector((state) => _.get(state, 'Config.keycloak'));
  const isAuthenticated = useSelector((state) => _.get(state, 'User.authenticated'));

  const dispatch = useDispatch();

  const initKeyCloak = () => {

    const keycloak = Keycloak(keycloakConfig)

    keycloak.init({ onLoad: 'login-required' }).then(authenticated => {
      dispatch({ type: TYPES.USER_LOGIN_SUCCESS, keycloak })
      // TODO: Add error handling if the keycloak server is down.
      if (authenticated) {
        keycloak.loadUserInfo().then(() => {
          // User roles are in the keycloak.tokenParsed
          dispatch({ type: TYPES.USER_LOGIN_SUCCESS, keycloak })
        })
      } else {
        // TODO: need UI design
        alert('Login Failed')
      }
    })
  }

  useEffect(initKeyCloak);

  if (isAuthenticated) {
    return <Redirect to='/tenant-admin' />;
  }

  return (
    <div>
      <Header serviceName="" />
    </div>
  );
}

export default Login;
