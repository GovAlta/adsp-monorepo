import React from 'react';
import { Switch, Route } from 'react-router-dom';
import TaskPage from './task';

function index(): JSX.Element {
  return (
    <Switch>
      <Route path="/admin/services/task">
        <TaskPage />
      </Route>
    </Switch>
  );
}

export default index;
