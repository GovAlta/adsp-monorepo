import React, { FunctionComponent, useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { TableDiv } from '../styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { deleteCommentComments } from '@store/comment/action';

import { Comment, TopicItem } from '@store/comment/model';

interface calendarTableProps {
  topic: TopicItem;
  selectedComment: Comment;
  selectedType: string;
  deleteConfirmation: boolean;
  onCancel?: () => void;
  deleteComment?: () => void;
}

export const DeleteConfirmationsView: FunctionComponent<calendarTableProps> = ({
  topic,
  selectedComment,
  selectedType,
  deleteConfirmation,
  onCancel,
  deleteComment,
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(deleteConfirmation);
  const dispatch = useDispatch();

  return (
    <TableDiv key="comment">
      <DeleteModal
        title="Delete comment"
        isOpen={showDeleteConfirmation}
        content={
          <div>
            <div>
              Are you sure you wish to delete <b>{`${selectedComment.title}?`}</b>
            </div>
          </div>
        }
        onCancel={() => {
          setShowDeleteConfirmation(false);
          onCancel();
        }}
        onDelete={() => {
          dispatch(deleteCommentComments(topic.id, selectedComment.id));
          deleteComment();
          setShowDeleteConfirmation(false);
        }}
      />
    </TableDiv>
  );
};
