import { GoAAppHeader, GoAButton, GoAMicrositeHeader } from '@abgov/react-components-new';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';
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
import { TaskQueue } from './TaskQueue';

export const TaskTenant = () => {
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const { url } = useRouteMatch();
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
              <GoAButton type="tertiary" onClick={() => dispatch(logoutUser({ tenant, from: url }))}>
                Sign out
              </GoAButton>
            ) : (
              <GoAButton type="tertiary" onClick={() => dispatch(loginUser({ tenant, from: url }))}>
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
              <Route path={`/${tenantName}/:namespace/:name`}>
                <TaskQueue />
              </Route>
              <Route path="/">
                <div>Tenant queues</div>
              </Route>
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
