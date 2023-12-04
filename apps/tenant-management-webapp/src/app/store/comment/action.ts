import { CommentTopicTypes, TopicItem } from './model';

export const FETCH_COMMENT_TOPIC_TYPES_ACTION = 'comment/FETCH_COMMENT_TOPIC_TYPES_ACTION';
export const FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION = 'comment/FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION';

export const UPDATE_COMMENT_TOPIC_TYPE_ACTION = 'comment/UPDATE_COMMENT_TOPIC_TYPE_ACTION';
export const UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION = 'comment/UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION';

export const DELETE_COMMENT_TOPIC_TYPE_ACTION = 'comment/DELETE_COMMENT_TOPIC_TYPE_ACTION';
export const DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION = 'comment/DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION';

export const ADD_TOPIC_REQUEST = 'ADD_TOPIC_REQUEST';
export const ADD_TOPIC_SUCCESS = 'ADD_TOPIC_SUCCESS';
export const FETCH_TOPICS = 'FETCH_TOPICS';
export const SET_TOPICS = 'SET_TOPICS';
export const ADD_COMMENT_REQUEST = 'ADD_COMMENT_REQUEST';
export const ADD_COMMENT_SUCCESS = 'ADD_COMMENT_SUCCESS';
export const DELETE_TOPIC_REQUEST = 'DELETE_TOPIC_REQUEST';
export const DELETE_TOPIC_SUCCESS = 'DELETE_TOPIC_SUCCESS';
export const DELETE_COMMENT_REQUEST = 'DELETE_COMMENT_REQUEST';
export const DELETE_COMMENT_SUCCESS = 'DELETE_COMMENT_SUCCESS';
export const FETCH_COMMENTS = 'comment/FETCH_COMMENTS';
export const FETCH_COMMENTS_SUCCESS = 'comment/FETCH_COMMENTS_SUCCESS';
export const FETCH_COMMENTS_FAILURE = 'comment/FETCH_COMMENTS_FAILURE';
export const DELETE_COMMENT = 'comment/DELETE_COMMENT';

export interface FetchCommentTopicTypesAction {
  type: typeof FETCH_COMMENT_TOPIC_TYPES_ACTION;
}

export interface FetchCommentTopicTypesSuccessAction {
  type: typeof FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION;
  payload: Record<string, CommentTopicTypes>;
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
  type: typeof ADD_TOPIC_REQUEST;
  payload: TopicItem[];
}

export interface AddTopicSuccessAction {
  type: typeof ADD_TOPIC_SUCCESS;
  payload: TopicItem[];
}

export interface FetchTopicsRequestAction {
  type: typeof FETCH_TOPICS;
  payload: CommentTopicTypes;
  next: string;
}

export interface SetTopicsAction {
  type: typeof SET_TOPICS;
  payload: TopicItem[];
  after: string;
  next: string;
}

export interface DeleteTopicRequestAction {
  type: typeof DELETE_TOPIC_REQUEST;
  payload: string;
}

export interface DeleteTopicSuccessAction {
  type: typeof DELETE_TOPIC_SUCCESS;
  payload: string;
}

export interface FetchCommentsAction {
  type: typeof FETCH_COMMENTS;
  payload: TopicItem;
}

export interface FetchCommentsSuccessAction {
  type: typeof FETCH_COMMENTS_SUCCESS;
  payload: Comment[];
}

export interface FetchCommentsFailureAction {
  type: typeof FETCH_COMMENTS_FAILURE;
  payload: string;
}

export interface AddCommentAction {
  type: typeof ADD_COMMENT_REQUEST;
  payload: Comment[];
}

export interface DeleteCommentAction {
  type: typeof DELETE_COMMENT;
  payload: string;
}

export interface AddCommentSuccessAction {
  type: typeof ADD_COMMENT_SUCCESS;
  payload: Comment;
}

export interface DeleteCommentSuccessAction {
  type: typeof DELETE_COMMENT_SUCCESS;
  payload: string;
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
  | DeleteTopicSuccessAction
  | DeleteCommentSuccessAction;

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

export const getCommentTopicTypesSuccess = (
  results: Record<string, CommentTopicTypes>
): FetchCommentTopicTypesSuccessAction => ({
  type: FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION,
  payload: results,
});

export const addTopicRequest = (topic: TopicItem[]): AddTopicRequestAction => ({
  type: ADD_TOPIC_REQUEST,
  payload: topic,
});

export const addTopicSuccess = (topic: TopicItem[]): AddTopicSuccessAction => ({
  type: ADD_TOPIC_SUCCESS,
  payload: topic,
});

export const fetchTopicsRequest = (topicType: CommentTopicTypes, next?: string): FetchTopicsRequestAction => ({
  type: FETCH_TOPICS,
  payload: topicType,
  next,
});

export const setTopics = (topics: TopicItem[], after: string, next: string): SetTopicsAction => ({
  type: SET_TOPICS,
  payload: topics,
  after,
  next,
});

export const deleteTopicRequest = (topicId: string): DeleteTopicRequestAction => ({
  type: DELETE_TOPIC_REQUEST,
  payload: topicId,
});

export const deleteTopicSuccess = (topicId: string): DeleteTopicSuccessAction => ({
  type: DELETE_TOPIC_SUCCESS,
  payload: topicId,
});

export const fetchComments = (topicType: TopicItem): FetchCommentsAction => ({
  type: FETCH_COMMENTS,
  payload: topicType,
});

export const fetchCommentsSuccess = (comments: Comment[]): FetchCommentsSuccessAction => ({
  type: FETCH_COMMENTS_SUCCESS,
  payload: comments,
});

export const fetchCommentsFailure = (error: string): FetchCommentsFailureAction => ({
  type: FETCH_COMMENTS_FAILURE,
  payload: error,
});

export const addCommentRequest = (comment: Comment[]): AddCommentAction => ({
  type: ADD_COMMENT_REQUEST,
  payload: comment,
});

export const deleteComment = (commentId: string): DeleteCommentAction => ({
  type: DELETE_COMMENT,
  payload: commentId,
});

export const addCommentSuccess = (comment: Comment): AddCommentSuccessAction => ({
  type: ADD_COMMENT_SUCCESS,
  payload: comment,
});

export const deleteCommentSuccess = (commentId: string): DeleteCommentSuccessAction => ({
  type: DELETE_COMMENT_SUCCESS,
  payload: commentId,
});
