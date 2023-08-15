import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Form } from './form';
import { useRouteMatch } from 'react-router';
import { FormDefinitionEditor } from './definitions/formDefinitionEditor';

export const FormRouter = () => {
  const { url } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={`${url}/`}>
        <Form />
      </Route>
      <Route path={`${url}/edit/:id`} component={FormDefinitionEditor} />
      <Route path={`${url}/new`} component={FormDefinitionEditor} />
    </Switch>
  );
};
