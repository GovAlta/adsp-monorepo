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
  draftSelector,
  loadComments,
  selectedTopicSelector,
} from '../state';

export const CommentsViewer: FunctionComponent = () => {
  const topic = useSelector(selectedTopicSelector);
  const { results, next } = useSelector(commentsSelector);
  const loading = useSelector(commentLoadingSelector);
  const executing = useSelector(commentExecutingSelector);
  const draft = useSelector(draftSelector);
  const canComment = useSelector(canCommentSelector);

  const dispatch = useDispatch<AppDispatch>();

  return (
    <CommentsViewerComponent
      heading="Questions"
      addCommentLabel="Add response"
      comments={results}
      canComment={canComment}
      canLoadMore={!!next}
      loading={loading}
      commenting={executing}
      draft={draft}
      onLoadMore={() => dispatch(loadComments({ after: next, topic }))}
      onUpdateDraft={(draft) => dispatch(commentActions.setDraftComment(draft))}
      onAddComment={(draft) => dispatch(addComment({ topic, comment: draft, requiresAttention: false }))}
    />
  );
};

export default CommentsViewer;
