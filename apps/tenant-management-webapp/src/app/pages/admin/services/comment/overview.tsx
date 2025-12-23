import React, { FunctionComponent, useEffect } from 'react';
import { GoabButton } from '@abgov/react-components';
import { OverviewLayout } from '@components/Overview';
import { fetchCommentMetrics } from '@store/comment/action';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CommentMetrics } from './metrics';

interface CommentOverviewProps {
  setOpenAddTopicTypes: (val: boolean) => void;
}

export const CommentOverview: FunctionComponent<CommentOverviewProps> = ({ setOpenAddTopicTypes }) => {
  useEffect(() => {
    setOpenAddTopicTypes(false);
    navigate('/admin/services/comment');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchCommentMetrics());
  }, [dispatch]);

  const navigate = useNavigate();
  const description =
    'Comment services allows users to create topics and post comments against the topics. Topics are of a particular topic type, and the type determines the roles permitted to administer, read, or comment on a topic.';
  return (
    <OverviewLayout
      testId="comment-service-overview"
      description={description}
      addButton={
        <GoabButton
          testId="add-definition"
          onClick={() => {
            setOpenAddTopicTypes(true);
            navigate('/admin/services/comment?topicTypes=true');
          }}
        >
          Add topic type
        </GoabButton>
      }
      extra={<CommentMetrics />}
    />
  );
};
