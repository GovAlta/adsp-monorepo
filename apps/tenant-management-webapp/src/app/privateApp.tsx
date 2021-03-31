import React, { createContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

import Header from './components/appHeader';
import { RootState } from './store';
import { ApiUptimeFetch } from './store/api-status/actions';

export interface HeaderContext {
  setTitle: (title: string) => void;
}
export const HeaderCtx = createContext<HeaderContext>(null);

export function PrivateApp({ children }) {
  const [title, setTitle] = useState<string>('');
  const dispatch = useDispatch();

  // initiate the get API health reoccurring request
  useEffect(() => {
    setInterval(async () => dispatch(ApiUptimeFetch()), 10 * 1000);
  }, [dispatch]);

  return (
    <HeaderCtx.Provider value={{ setTitle }}>
      <Header serviceName={title} />
      <div>{children}</div>
    </HeaderCtx.Provider>
  );
}

export function PrivateRoute({ component: Component, ...rest }) {
  const homePath = '/';
  const isAuthenticated = useSelector((state: RootState) => state.session.authenticated);

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: homePath, state: { from: props.location } }} />
        )
      }
    />
  );
}

export default PrivateApp;
