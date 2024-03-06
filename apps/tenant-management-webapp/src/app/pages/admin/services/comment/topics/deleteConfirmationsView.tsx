import React, { useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { TableDiv, TopicDelete } from '../styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { deleteTopicRequest } from '@store/comment/action';

import { TopicItem } from '@store/comment/model';

interface deleteTopicProps {
  topic: TopicItem;
  selectedType: string;
  onCancel?: () => void;
  onDelete?: (topic) => void;
}

export const DeleteConfirmationsView = ({ topic, selectedType, onCancel, onDelete }: deleteTopicProps): JSX.Element => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    setShowDeleteConfirmation(true);
  }, [setShowDeleteConfirmation]);

  return (
    <TableDiv key="topic">
      <DeleteModal
        title="Delete topic"
        isOpen={showDeleteConfirmation}
        content={
          <div>
            <div>
              Are you sure you wish to delete <b>{`${topic.name}?`}</b>
              <br />
              <TopicDelete>
                *Please note that all associated comments with <b>{`${topic.name}`}</b> will be deleted as well.
              </TopicDelete>
            </div>
          </div>
        }
        onCancel={onCancel}
        onDelete={() => {
          dispatch(deleteTopicRequest(topic.id));
          setShowDeleteConfirmation(false);
          onDelete(topic);
        }}
      />
    </TableDiv>
  );
};
