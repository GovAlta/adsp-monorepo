import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Task } from './task';
import { useRouteMatch } from 'react-router';
import { TaskDefinitionEditor } from './TaskDefinationEditor';

export const TaskRouter = () => {
  const { url } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={`${url}/`}>
        <Task />
      </Route>
      <Route path={`${url}/edit/:id`} component={TaskDefinitionEditor} />
      <Route path={`${url}/new`} component={TaskDefinitionEditor} />
    </Switch>
  );
};
