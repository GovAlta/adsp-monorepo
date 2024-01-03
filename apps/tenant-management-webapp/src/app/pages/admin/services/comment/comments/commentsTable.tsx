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
  LoadMoreCommentsWrapper,
  CommentsHeadGroup,
  CommentsDate,
} from '../styled-components';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton } from '@abgov/react-components-new';
import { AddCommentModal } from '../comments/addCommentModal';
import { DeleteConfirmationsView } from '../comments/deleteConfirmationsView';
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
  selectedType: string;
}
export const CommentListTable: FunctionComponent<CommentTableProps> = ({ topic, selectedType }) => {
  const [showAddComment, setShowAddComment] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedComment, setSelectedComment] = useState(defaultComment);
  const [deleteAction, setDeleteAction] = useState(false);
  const next = useSelector((state: RootState) => state.comment.nextCommentEntries);
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
  }, [showAddComment, deleteAction]);
  const reset = () => {
    setShowAddComment(false);
  };
  const handleSave = (comment) => {
    comment.topicId = topic.id;
    comment.title = comment.content;
    if (modalType === 'new') {
      dispatch(addCommentRequest(comment));
    } else {
      dispatch(updateComment({ topicId: topic.id, comment: comment }));
      dispatch(fetchComments(topic.id));
    }
  };

  const onNext = () => {
    dispatch(fetchComments(topic.id, next));
  };

  const deleteComment = () => {
    setDeleteAction(false);
  };
  const onDeleteComment = (comment) => {
    setSelectedComment(comment);
    setDeleteAction(true);
    comment.topicId = topic.id;
  };

  return (
    <>
      <HeaderFont>
        <label>Comments list</label>
        <GoAButton size="compact" type="secondary" testId="add-comment" onClick={addNewComment}>
          Add Comment
        </GoAButton>
      </HeaderFont>
      {comments &&
        comments.length > 0 &&
        comments.map((comment) => {
          const date = new Date(comment.lastUpdatedOn);
          return (
            <CommentsList>
              <CommentsHeader>
                <CommentsHeadGroup>
                  <CommentsHeading> {comment.lastUpdatedBy.name}</CommentsHeading>
                  <CommentsDate> {formatDate(date)} </CommentsDate>
                </CommentsHeadGroup>
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
                      onClick={() => onDeleteComment(comment)}
                    />
                  </IconDiv>
                </CommentsActions>
              </CommentsHeader>
              <CommentBody>{comment.content}</CommentBody>
            </CommentsList>
          );
        })}
      {next && (
        <LoadMoreCommentsWrapper>
          <GoAButton testId="comment-load-more-btn" key="comment-load-more-btn" type="tertiary" onClick={onNext}>
            View older comments
          </GoAButton>
        </LoadMoreCommentsWrapper>
      )}
      {deleteAction && (
        <DeleteConfirmationsView
          topic={topic}
          selectedComment={selectedComment}
          selectedType={selectedType}
          deleteConfirmation={true}
          onCancel={() => setDeleteAction(false)}
          deleteComment={deleteComment}
        ></DeleteConfirmationsView>
      )}
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
