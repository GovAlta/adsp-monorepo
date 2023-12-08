import React, { FunctionComponent, useState } from 'react';
import { TopicItem } from '@store/comment/model';

import {
  HeaderFont,
  CommentsList,
  CommentsHeader,
  CommentsHeading,
  CommentsActions,
  CommentBody,
} from '../styled-components';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components-new';
import { AddCommentModal } from '../comments/addCommentModal';
import { addCommentRequest } from '@store/comment/action';

export interface CommentTableProps {
  topic: TopicItem;
  onDeleteComment?: (Comment) => void;
}
export const CommentListTable: FunctionComponent<CommentTableProps> = ({ topic, onDeleteComment }) => {
  const [showAddComment, setShowAddComment] = useState(false);
  const comments = useSelector((state: RootState) => {
    return state?.comment?.comments;
  });
  const dispatch = useDispatch();
  const addNewComment = () => {
    setShowAddComment(true);
  };
  const reset = () => {
    setShowAddComment(true);
  };
  const handleSave = (comment) => {
    comment.topicId = topic.id;
    comment.title = comment.content;
    dispatch(addCommentRequest(comment));
  };
  return (
    <>
      <HeaderFont>
        <label>Comment list</label>
        <GoAButton size="compact" type="tertiary" testId="add-comment" onClick={addNewComment}>
          Add Comment
        </GoAButton>
      </HeaderFont>
      {Object.keys(comments).map((comment) => {
        return (
          <CommentsList>
            <CommentsHeader>
              <CommentsHeading>{comment}</CommentsHeading>
              <CommentsActions>{comment}</CommentsActions>
            </CommentsHeader>
            <CommentBody>{comment}</CommentBody>
          </CommentsList>
        );
      })}
      {showAddComment && (
        <AddCommentModal
          open={showAddComment}
          topic={topic}
          type="new"
          onCancel={() => {
            reset();
          }}
          onSave={handleSave}
        />
      )}
    </>
  );
};
