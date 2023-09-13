import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Comment } from './comment';
import { useRouteMatch } from 'react-router';
import { CommentTopicTypesEditor } from './topicTypes/commentTopicTypesEditor';

export const CommentRouter = () => {
  const { url } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={`${url}/`}>
        <Comment />
      </Route>
      <Route path={`${url}/edit/:id`} component={CommentTopicTypesEditor} />
      <Route path={`${url}/new`} component={CommentTopicTypesEditor} />
    </Switch>
  );
};
