import React, { FunctionComponent, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { TableDiv } from '../styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { deleteTopicRequest } from '@store/comment/action';

import { TopicItem } from '@store/comment/model';

interface calendarTableProps {
  topic: TopicItem;
  selectedType: string;
  onCancel?: () => void;
  onDelete?: (topic) => void;
}

export const DeleteConfirmationsView: FunctionComponent<calendarTableProps> = ({
  topic,
  selectedType,
  onCancel,
  onDelete,
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    setShowDeleteConfirmation(true);
  });

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
              *Please note that all associated comments with <b>{`${topic.name}`}</b> will be deleted as well.
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
