import React, { FunctionComponent, useEffect, useState } from 'react';
import { TopicItem, defaultComment } from '@store/comment/model';

import {
  HeaderFont,
  CommentsList,
  CommentsHeader,
  CommentsHeading,
  CommentsActions,
  CommentBody,
  IconDiv,
} from '../styled-components';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components-new';
import { AddCommentModal } from '../comments/addCommentModal';
import { addCommentRequest, fetchComments, updateComment } from '@store/comment/action';
import { GoAContextMenuIcon } from '@components/ContextMenu';

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is zero-based
  const day = date.getDate().toString().padStart(2, '0');

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHour = hours % 12 || 12; // Converts 24h to 12h format and handles midnight

  return `${year}-${month}-${day}, ${formattedHour}:${minutes} ${ampm}`;
}

export interface CommentTableProps {
  topic: TopicItem;
}
export const CommentListTable: FunctionComponent<CommentTableProps> = ({ topic }) => {
  const [showAddComment, setShowAddComment] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedComment, setSelectedComment] = useState(defaultComment);
  const comments = useSelector((state: RootState) => {
    return state?.comment?.comments;
  });
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchComments(topic.id));
  }, []);
  const addNewComment = () => {
    setModalType('new');
    setSelectedComment(defaultComment);
    setShowAddComment(true);
  };
  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [showAddComment]);
  const reset = () => {
    setShowAddComment(false);
  };
  const handleSave = (comment) => {
    comment.topicId = topic.id;
    comment.title = comment.content;
    if (modalType === 'new') {
      dispatch(addCommentRequest(comment));
    } else {
      dispatch(updateComment(topic.id, comment));
      dispatch(fetchComments(topic.id));
    }
  };
  const onDeleteComment = (comment) => {
    comment.topicId = topic.id;
  };
  return (
    <>
      <HeaderFont>
        <label>Comment list</label>
        <GoAButton size="compact" type="primary" testId="add-comment" onClick={addNewComment}>
          Add Comment
        </GoAButton>
      </HeaderFont>
      {comments.map((comment) => {
        const date = new Date(comment.lastUpdatedOn);
        return (
          <CommentsList>
            <CommentsHeader>
              <CommentsHeading>
                {comment.lastUpdatedBy.name} {formatDate(date)}
              </CommentsHeading>
              <CommentsActions>
                <IconDiv>
                  <GoAContextMenuIcon
                    type="create"
                    title="Edit"
                    onClick={() => {
                      setModalType('edit');
                      setSelectedComment(comment);
                      setShowAddComment(true);
                    }}
                    testId="toggle-details-visibility"
                  />
                  <GoAContextMenuIcon
                    testId="topic-definition-edit"
                    title="Delete"
                    type="trash"
                    onClick={() => onDeleteComment}
                  />
                </IconDiv>
              </CommentsActions>
            </CommentsHeader>
            <CommentBody>{comment.content}</CommentBody>
          </CommentsList>
        );
      })}
      {showAddComment && (
        <AddCommentModal
          open={showAddComment}
          topic={topic}
          selComment={selectedComment}
          type={modalType}
          onCancel={() => {
            reset();
          }}
          onSave={handleSave}
        />
      )}
    </>
  );
};
