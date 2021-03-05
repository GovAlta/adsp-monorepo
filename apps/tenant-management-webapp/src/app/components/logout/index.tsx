import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import Keycloak from 'keycloak-js';

import { RootState } from '../../store';
import { SessionLogout } from '../../store/session/actions';

// TODO: look at Athena's changes
// import UserService from '../../service/userSevice';

function Logout() {
  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);
  const dispatch = useDispatch();
  const logout = () => {
    const keycloak = Keycloak(keycloakConfig);

    // Double check the auth status
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (authenticated) {
        keycloak.logout();
      } else {
        // If keycloak successfuly logout, it will redirect to the logout page again.
        // After confirm that we have successfully logout and we can update the state.
        // Another way of achieving this is to add async wrapper on the keycloak logout function.
        // Paul tried: keycloak.logout().then. And, this does not work.
        dispatch(SessionLogout());
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
