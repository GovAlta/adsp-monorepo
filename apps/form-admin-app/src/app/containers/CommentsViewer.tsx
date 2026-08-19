import { CommentsViewer as CommentsViewerComponent } from '@core-services/app-common';
import { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  addComment,
  canCommentSelector,
  commentActions,
  commentExecutingSelector,
  commentLoadingSelector,
  commentsSelector,
  deleteComment,
  draftSelector,
  loadComments,
  selectedTopicSelector,
  userSelector,
} from '../state';

export const CommentsViewer: FunctionComponent = () => {
  const topic = useSelector(selectedTopicSelector);
  const { user } = useSelector(userSelector);

  const { results, next } = useSelector(commentsSelector);
  const loading = useSelector(commentLoadingSelector);
  const executing = useSelector(commentExecutingSelector);
  const draft = useSelector(draftSelector);
  const canComment = useSelector(canCommentSelector);

  const dispatch = useDispatch<AppDispatch>();

  return (
    <CommentsViewerComponent
      heading=" "
      addCommentLabel="Add response"
      comments={results}
      canComment={canComment}
      canLoadMore={!!next}
      topicId={topic?.id}
      loading={loading}
      commenting={executing}
      userId={user.id}
      draft={draft}
      onLoadMore={() => dispatch(loadComments({ after: next, topic }))}
      onUpdateDraft={(draft) => dispatch(commentActions.setDraftComment(draft))}
      onAddComment={(draft) => dispatch(addComment({ topic, comment: draft, requiresAttention: false }))}
      onDeleteComment={(topicId, commentId) => dispatch(deleteComment({ topicId: topic.id, commentId }))}
    />
  );
};

export default CommentsViewer;
