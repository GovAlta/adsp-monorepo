import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Task } from './task';
import { useRouteMatch } from 'react-router';
import { QueueModalEditor } from './queueModalEditor';

export const TaskRouter = () => {
  const { url } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={`${url}/`}>
        <Task />
      </Route>
      <Route path={`${url}/edit/:id`} component={QueueModalEditor} />
      <Route path={`${url}/new`} component={QueueModalEditor} />
    </Switch>
  );
};
