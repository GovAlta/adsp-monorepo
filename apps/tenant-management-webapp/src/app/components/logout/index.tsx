import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { TYPES } from '../../store/actions';
import { Link } from 'react-router-dom';
import Keycloak from 'keycloak-js';
import { RootState } from '../../store/reducers';

function Logout() {
  const KeycloakConfig = useSelector(
    (state: RootState) => state.config.keycloak
  );
  const dispatch = useDispatch();
  const logout = () => {
    const keycloak = Keycloak(KeycloakConfig);

    // Double check the auth status
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (authenticated) {
        keycloak.logout();
      } else {
        // If keycloak successfuly logout, it will redirect to the logout page again.
        // After confirm that we have successfully logout and we can update the state.
        // Another way of achieving this is to add async wrapper on the keycloak logout function.
        // Paul tried: keycloak.logout().then. And, this does not work.
        dispatch({ type: TYPES.USER_LOGOUT });
      }
    });
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
