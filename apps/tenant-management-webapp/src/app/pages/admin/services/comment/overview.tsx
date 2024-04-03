import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components-new';
import { OverviewLayout } from '@components/Overview';
import { useNavigate } from 'react-router-dom';

interface CommentOverviewProps {
  setOpenAddTopicTypes: (val: boolean) => void;
}

export const CommentOverview: FunctionComponent<CommentOverviewProps> = ({ setOpenAddTopicTypes }) => {
  useEffect(() => {
    setOpenAddTopicTypes(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useNavigate();
  const description =
    'Comment services allows users to create topics and post comments against the topics. Topics are of a particular topic type, and the type determines the roles permitted to administer, read, or comment on a topic.';
  return (
    <OverviewLayout
      testId="comment-service-overview"
      description={description}
      addButton={
        <GoAButton
          testId="add-definition"
          onClick={() => {
            setOpenAddTopicTypes(true);
            navigate('/admin/services/comment?topicTypes=true');
          }}
        >
          Add topic type
        </GoAButton>
      }
    />
  );
};
