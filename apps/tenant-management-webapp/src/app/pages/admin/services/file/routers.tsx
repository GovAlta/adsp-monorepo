import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { File } from './file';
import { useRouteMatch } from 'react-router';
import { AddEditFileTypeDefinitionEditor } from './addEditFileTypeDefinitionEditor';

export const FileRouter = () => {
  const { url } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={`${url}/`}>
        <File />
      </Route>
      <Route path={`${url}/edit/:id`} component={AddEditFileTypeDefinitionEditor} />
      <Route path={`${url}/new`} component={AddEditFileTypeDefinitionEditor} />
    </Switch>
  );
};
