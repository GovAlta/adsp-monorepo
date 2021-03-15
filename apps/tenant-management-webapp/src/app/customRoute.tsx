import { Route, Redirect } from 'react-router-dom';
import React from 'react';
import { isAuthenticated } from './services/session';

export function PrivateRoute({ component: Component, ...rest }) {
  const homePath = '/';
  const authenticated = isAuthenticated();

  return (
    <Route
      {...rest}
      render={(props) =>
        authenticated === true ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: homePath, state: { from: props.location } }} />
        )
      }
    />
  );
}
