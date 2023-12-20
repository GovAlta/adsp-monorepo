import { GoAAppHeader, GoAButton, GoAMicrositeHeader } from '@abgov/react-components-new';
import React, { Suspense, lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, Route, Switch, useLocation, useParams } from 'react-router-dom';
import {
  AppDispatch,
  configInitializedSelector,
  initializeTenant,
  loginUser,
  logoutUser,
  tenantSelector,
  userInitializedSelector,
  userSelector,
} from '../state';
import { FeedbackNotification } from './FeedbackNotification';

const TaskQueue = lazy(() => import('./TaskQueue'));
const TaskQueues = lazy(() => import('./TaskQueues'));

export const TaskTenant = () => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const tenant = useSelector(tenantSelector);
  const configInitialized = useSelector(configInitializedSelector);
  const userInitialized = useSelector(userInitializedSelector);
  const user = useSelector(userSelector);

  useEffect(() => {
    if (configInitialized) {
      dispatch(initializeTenant(tenantName));
    }
  }, [configInitialized, tenantName, dispatch]);

  return (
    <React.Fragment>
      <GoAMicrositeHeader type="alpha" />
      <GoAAppHeader url="/" heading={`${tenant?.name || tenantName} - Task management`}>
        {userInitialized && (
          <span>
            <span>{user?.name}</span>
            {user ? (
              <GoAButton type="tertiary" onClick={() => dispatch(logoutUser({ tenant, from: location.pathname }))}>
                Sign out
              </GoAButton>
            ) : (
              <GoAButton type="tertiary" onClick={() => dispatch(loginUser({ tenant, from: location.pathname }))}>
                Sign in
              </GoAButton>
            )}
          </span>
        )}
      </GoAAppHeader>
      <FeedbackNotification />
      <main>
        {user && (
          <section>
            <Switch>
              <Route exact path={`/${tenantName}/:namespace/:name`}>
                <Suspense>
                  <TaskQueue />
                </Suspense>
              </Route>
              <Route exact path={`/${tenantName}`}>
                <Suspense>
                  <TaskQueues />
                </Suspense>
              </Route>
              <Redirect to={`/${tenantName}`} />
            </Switch>
          </section>
        )}
        {userInitialized && !user && (
          <section>
            <div>Sign in to access task queues.</div>
          </section>
        )}
      </main>
    </React.Fragment>
  );
};
