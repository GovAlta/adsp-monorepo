import React, { FunctionComponent, useEffect } from 'react';

import { OverviewLayout } from '@components/Overview';
import { useHistory } from 'react-router-dom';

interface CommentOverviewProps {
  setOpenAddTemplate: (val: boolean) => void;
}

export const CommentOverview: FunctionComponent<CommentOverviewProps> = ({ setOpenAddTemplate }) => {
  useEffect(() => {
    history.push({
      pathname: '/admin/services/comment',
    });
  }, []);

  const history = useHistory();
  const description =
    'Comment services allows users to create topics and post comments against the topics. Topics are of a particular topic type, and the type determines the roles permitted to administer, read, or comment on a topic.';
  return <OverviewLayout testId="comment-service-overview" description={description} />;
};
