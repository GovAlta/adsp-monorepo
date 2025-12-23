import React, { FunctionComponent, useEffect, useState } from 'react';
import { TopicItem, defaultComment } from '@store/comment/model';
import { renderNoItem } from '@components/NoItem';

import {
  HeaderFont,
  CommentsList,
  CommentsHeader,
  CommentsHeading,
  CommentsActions,
  CommentBody,
  LoadMoreCommentsWrapper,
  CommentsHeadGroup,
  CommentsDate,
  CommentLoader,
} from '../styled-components';
import { ActionIconsDiv } from '../../styled-components';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { GoabButton, GoabCircularProgress } from '@abgov/react-components';
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
  }, [dispatch, topic.id]);
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
  const elementIndicator = useSelector((state: RootState) => {
    return state?.session?.elementIndicator;
  });
  // eslint-disable-next-line
  useEffect(() => {}, [elementIndicator]);
  return (
    <section>
      <HeaderFont>
        <h3>Comments list</h3>
        <GoabButton size="compact" type="secondary" testId="add-comment" onClick={addNewComment}>
          Add comment
        </GoabButton>
      </HeaderFont>

      {comments &&
        comments.length > 0 &&
        comments.map((comment, index) => {
          const date = new Date(comment.lastUpdatedOn);
          return (
            <CommentsList data-testid={`commentsList-${index}`} key={`commentsList-${index}`}>
              <CommentsHeader data-testid={`commentsHeader-${index}`}>
                <CommentsHeadGroup data-testid={`commentsHeadGroup-${index}`}>
                  <CommentsHeading data-testid={`updatedBy-${index}`}> {comment.lastUpdatedBy.name}</CommentsHeading>
                  <CommentsDate data-testid={`commentDate-${index}`}> {formatDate(date)} </CommentsDate>
                </CommentsHeadGroup>
                <CommentsActions>
                  <ActionIconsDiv>
                    <GoAContextMenuIcon
                      type="create"
                      title="Edit"
                      onClick={() => {
                        setModalType('edit');
                        setSelectedComment(comment);
                        setShowAddComment(true);
                      }}
                      testId="comment-edit"
                    />
                    <GoAContextMenuIcon
                      testId="comment-delete"
                      title="Delete"
                      type="trash"
                      onClick={() => onDeleteComment(comment)}
                    />
                  </ActionIconsDiv>
                </CommentsActions>
              </CommentsHeader>

              <CommentBody data-testid={`comment-content-${index}`}>{comment.content}</CommentBody>

              <br />
            </CommentsList>
          );
        })}

      {elementIndicator?.show && (
        <CommentLoader>
          <GoabCircularProgress size="small" visible={true} />
        </CommentLoader>
      )}
      {!elementIndicator?.show && comments && !comments.length && renderNoItem('comments')}
      {next && (
        <LoadMoreCommentsWrapper>
          <GoabButton testId="comment-load-more-btn" key="comment-load-more-btn" type="tertiary" onClick={onNext}>
            View older comments
          </GoabButton>
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
    </section>
  );
};
