import { CommentTopicTypes, TopicItem, Comment, CommentMetrics } from './model';

export const FETCH_COMMENT_TOPIC_TYPES_ACTION = 'comment/FETCH_COMMENT_TOPIC_TYPES_ACTION';
export const FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION = 'comment/FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION';

export const UPDATE_COMMENT_TOPIC_TYPE_ACTION = 'comment/UPDATE_COMMENT_TOPIC_TYPE_ACTION';
export const UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION = 'comment/UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION';

export const DELETE_COMMENT_TOPIC_TYPE_ACTION = 'comment/DELETE_COMMENT_TOPIC_TYPE_ACTION';
export const DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION = 'comment/DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION';

export const CREATE_COMMENT_TOPIC_ACTION = 'comment/CREATE_COMMENT_TOPIC_ACTION';
export const CREATE_COMMENT_TOPIC_SUCCESS_ACTION = 'comment/CREATE_COMMENT_TOPIC_SUCCESS_ACTION';
export const FETCH_COMMENT_TOPICS_ACTION = 'comment/FETCH_COMMENT_TOPICS_ACTION';
export const SET_COMMENT_TOPICS_ACTION = 'comment/SET_COMMENT_TOPICS_ACTION';
export const CREATE_COMMENT_COMMENTS_ACTION = 'comment/CREATE_COMMENT_COMMENT_ACTION';
export const CLEAR_COMMENT_COMMENTS_ACTION = 'comment/CLEAR_COMMENT_COMMENTS_ACTION';
export const UPDATE_COMMENT_COMMENTS_ACTION = 'comment/UPDATE_COMMENT_COMMENTS_ACTION';
export const CREATE_COMMENT_COMMENTS_SUCCESS = 'comment/CREATE_COMMENT_COMMENTS_SUCCESS';
export const UPDATE_COMMENT_COMMENTS_SUCCESS = 'comment/UPDATE_COMMENT_COMMENTS_SUCCESS';
export const FETCH_COMMENT_COMMENTS_SUCCESS = 'comment/FETCH_COMMENT_COMMENTS_SUCCESS';
export const DELETE_COMMENT_TOPIC_ACTION = 'comment/DELETE_COMMENT_TOPIC_ACTION';
export const DELETE_COMMENT_TOPIC_SUCCESS = 'comment/DELETE_COMMENT_TOPIC_SUCCESS';
export const DELETE_COMMENT_COMMENTS_ACTION = 'comment/DELETE_COMMENT_COMMENTS_ACTION';
export const DELETE_COMMENT_COMMENTS_SUCCESS = 'comment/DELETE_COMMENT_COMMENTS_SUCCESS';
export const FETCH_COMMENT_TOPIC_COMMENTS = 'comment/FETCH_COMMENT_TOPIC_COMMENTS';
export const FETCH_COMMENT_TOPIC_COMMENTS_SUCCESS = 'comment/FETCH_COMMENT_TOPIC_COMMENTS_SUCCESS';
export const FETCH_COMMENT_TOPIC_COMMENTS_FAILURE = 'comment/FETCH_COMMENT_TOPIC_COMMENTS_FAILURE';
export const DELETE_COMMENT = 'comment/DELETE_COMMENT';

export const FETCH_COMMENT_METRICS = 'comment-service/metrics/fetch';
export const FETCH_COMMENT_METRICS_SUCCEEDED = 'comment-service/metrics/fetch/success';

export interface FetchCommentTopicTypesAction {
  type: typeof FETCH_COMMENT_TOPIC_TYPES_ACTION;
}

export interface FetchCommentTopicTypesSuccessAction {
  type: typeof FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION;
  payload: {
    types: { TopicTypes: CommentTopicTypes[]; core: CommentTopicTypes[] };
  };
}

export interface UpdateCommentTopicTypesAction {
  type: typeof UPDATE_COMMENT_TOPIC_TYPE_ACTION;
  topicType: CommentTopicTypes;
  options?: string;
}

export interface UpdateCommentTopicTypesSuccessAction {
  type: typeof UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION;
  payload: Record<string, CommentTopicTypes>;
}

export interface DeleteCommentTopicTypeAction {
  type: typeof DELETE_COMMENT_TOPIC_TYPE_ACTION;
  topicTypeId: string;
}

export interface DeleteCommentTopicTypeSuccessAction {
  type: typeof DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION;
  payload: Record<string, CommentTopicTypes>;
}

export interface AddTopicRequestAction {
  type: typeof CREATE_COMMENT_TOPIC_ACTION;
  payload: TopicItem[];
}

export interface AddTopicSuccessAction {
  type: typeof CREATE_COMMENT_TOPIC_SUCCESS_ACTION;
  payload: TopicItem;
}

export interface FetchTopicsRequestAction {
  type: typeof FETCH_COMMENT_TOPICS_ACTION;
  payload: CommentTopicTypes;
  next: string;
}

export interface SetTopicsAction {
  type: typeof SET_COMMENT_TOPICS_ACTION;
  payload: TopicItem[];
  after: string;
  next: string;
}

export interface DeleteTopicRequestAction {
  type: typeof DELETE_COMMENT_TOPIC_ACTION;
  payload: string;
}

export interface DeleteTopicSuccessAction {
  type: typeof DELETE_COMMENT_TOPIC_SUCCESS;
  payload: string;
}

export interface FetchCommentsAction {
  type: typeof FETCH_COMMENT_TOPIC_COMMENTS;
  payload: TopicItem;
  next: string;
}
export interface ClearCommentsAction {
  type: typeof CLEAR_COMMENT_COMMENTS_ACTION;
}

export interface FetchCommentsSuccessAction {
  type: typeof FETCH_COMMENT_TOPIC_COMMENTS_SUCCESS;
  payload: Comment[];
}

export interface FetchCommentsFailureAction {
  type: typeof FETCH_COMMENT_TOPIC_COMMENTS_FAILURE;
  payload: string;
}

export interface AddCommentAction {
  type: typeof CREATE_COMMENT_COMMENTS_ACTION;
  payload: Comment[];
}

export interface DeleteCommentAction {
  type: typeof DELETE_COMMENT;
  payload: DeletePayload;
}
export interface UpdateCommentAction {
  type: typeof UPDATE_COMMENT_COMMENTS_ACTION;
  payload: DeletePayload;
}

export interface FetchCommentSuccessAction {
  type: typeof FETCH_COMMENT_COMMENTS_SUCCESS;
  payload: Comment[];
  after: string;
  next: string;
}
export interface AddCommentSuccessAction {
  type: typeof CREATE_COMMENT_COMMENTS_SUCCESS;
  payload: Comment;
  after: string;
  next: string;
}
export interface UpdateCommentSuccessAction {
  type: typeof UPDATE_COMMENT_COMMENTS_SUCCESS;
  payload: Comment;
  after: string;
  next: string;
}

export interface DeletePayload {
  comment: number;
  topicId: number;
}
export interface DeleteCommentSuccessAction {
  type: typeof DELETE_COMMENT_COMMENTS_SUCCESS;
  payload: DeletePayload;
}

export interface FetchCommentMetricsAction {
  type: typeof FETCH_COMMENT_METRICS;
}

export interface FetchCommentMetricsSucceededAction {
  type: typeof FETCH_COMMENT_METRICS_SUCCEEDED;
  payload: CommentMetrics;
}

export type CommentActionTypes =
  | FetchCommentTopicTypesSuccessAction
  | FetchCommentTopicTypesAction
  | DeleteCommentTopicTypeAction
  | DeleteCommentTopicTypeSuccessAction
  | UpdateCommentTopicTypesAction
  | UpdateCommentTopicTypesSuccessAction
  | FetchCommentsAction
  | FetchCommentsSuccessAction
  | FetchCommentsFailureAction
  | AddCommentAction
  | DeleteCommentAction
  | AddTopicSuccessAction
  | SetTopicsAction
  | AddCommentSuccessAction
  | UpdateCommentSuccessAction
  | FetchCommentSuccessAction
  | DeleteTopicSuccessAction
  | DeleteCommentSuccessAction
  | FetchCommentMetricsAction
  | FetchCommentMetricsSucceededAction;

export const updateCommentTopicType = (
  topicType: CommentTopicTypes,
  options?: string
): UpdateCommentTopicTypesAction => ({
  type: UPDATE_COMMENT_TOPIC_TYPE_ACTION,
  topicType,
  options,
});

export const updateCommentTopicTypesSuccess = (
  topicType: Record<string, CommentTopicTypes>
): UpdateCommentTopicTypesSuccessAction => ({
  type: UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  payload: topicType,
});

export const deleteCommentTopicType = (topicTypeId: string): DeleteCommentTopicTypeAction => ({
  type: DELETE_COMMENT_TOPIC_TYPE_ACTION,
  topicTypeId,
});

export const deleteCommentTopicTypeSuccess = (
  topicTypes: Record<string, CommentTopicTypes>
): DeleteCommentTopicTypeSuccessAction => ({
  type: DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  payload: topicTypes,
});

export const getCommentTopicTypes = (): FetchCommentTopicTypesAction => ({
  type: FETCH_COMMENT_TOPIC_TYPES_ACTION,
});

export const getCommentTopicTypesSuccess = (types: {
  TopicTypes: CommentTopicTypes[];
  core: CommentTopicTypes[];
}): FetchCommentTopicTypesSuccessAction => ({
  type: FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION,
  payload: { types },
});

export const addTopicRequest = (topic: TopicItem[]): AddTopicRequestAction => ({
  type: CREATE_COMMENT_TOPIC_ACTION,
  payload: topic,
});

export const addTopicSuccess = (topic: TopicItem): AddTopicSuccessAction => ({
  type: CREATE_COMMENT_TOPIC_SUCCESS_ACTION,
  payload: topic,
});

export const fetchTopicsRequest = (topicType: CommentTopicTypes, next?: string): FetchTopicsRequestAction => ({
  type: FETCH_COMMENT_TOPICS_ACTION,
  payload: topicType,
  next,
});

export const setTopics = (topics: TopicItem[], after: string, next: string): SetTopicsAction => ({
  type: SET_COMMENT_TOPICS_ACTION,
  payload: topics,
  after,
  next,
});

export const deleteTopicRequest = (topicId: string): DeleteTopicRequestAction => ({
  type: DELETE_COMMENT_TOPIC_ACTION,
  payload: topicId,
});

export const deleteTopicSuccess = (topicId: string): DeleteTopicSuccessAction => ({
  type: DELETE_COMMENT_TOPIC_SUCCESS,
  payload: topicId,
});

export const fetchComments = (topicType: TopicItem, next?: string): FetchCommentsAction => ({
  type: FETCH_COMMENT_TOPIC_COMMENTS,
  payload: topicType,
  next,
});
export const clearComments = (): ClearCommentsAction => ({
  type: CLEAR_COMMENT_COMMENTS_ACTION,
});

export const fetchCommentsSuccess = (comments: Comment[]): FetchCommentsSuccessAction => ({
  type: FETCH_COMMENT_TOPIC_COMMENTS_SUCCESS,
  payload: comments,
});

export const fetchCommentsFailure = (error: string): FetchCommentsFailureAction => ({
  type: FETCH_COMMENT_TOPIC_COMMENTS_FAILURE,
  payload: error,
});

export const addCommentRequest = (comment: Comment[]): AddCommentAction => ({
  type: CREATE_COMMENT_COMMENTS_ACTION,
  payload: comment,
});

export const updateComment = ({ topicId, comment }): UpdateCommentAction => ({
  type: UPDATE_COMMENT_COMMENTS_ACTION,
  payload: { topicId, comment },
});
export const deleteCommentComments = ({ comment, topicId }): DeleteCommentAction => ({
  type: DELETE_COMMENT,
  payload: { topicId, comment },
});
export const addCommentSuccess = (comment: Comment, after: string, next: string): AddCommentSuccessAction => ({
  type: CREATE_COMMENT_COMMENTS_SUCCESS,
  payload: comment,
  after,
  next,
});
export const updateCommentSuccess = (comment: Comment, after: string, next: string): UpdateCommentSuccessAction => ({
  type: UPDATE_COMMENT_COMMENTS_SUCCESS,
  payload: comment,
  after,
  next,
});

export const fetchCommentSuccess = (comment: Comment[], after: string, next: string): FetchCommentSuccessAction => ({
  type: FETCH_COMMENT_COMMENTS_SUCCESS,
  payload: comment,
  after,
  next,
});

export const deleteCommentSuccess = ({ comment, topicId }): DeleteCommentSuccessAction => ({
  type: DELETE_COMMENT_COMMENTS_SUCCESS,
  payload: { topicId, comment },
});

export const fetchCommentMetrics = (): FetchCommentMetricsAction => ({
  type: FETCH_COMMENT_METRICS,
});

export const fetchCommentMetricsSucceeded = (metrics: CommentMetrics): FetchCommentMetricsSucceededAction => ({
  type: FETCH_COMMENT_METRICS_SUCCEEDED,
  payload: metrics,
});
