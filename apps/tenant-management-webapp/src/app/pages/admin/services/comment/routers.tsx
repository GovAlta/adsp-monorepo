import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Comment } from './comment';
import { useRouteMatch } from 'react-router';

export const CommentRouter = () => {
  const { url } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={`${url}/`}>
        <Comment />
      </Route>
    </Switch>
  );
};
