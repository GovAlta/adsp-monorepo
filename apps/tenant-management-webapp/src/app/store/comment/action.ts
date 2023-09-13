import { CommentTopicTypes } from './model';

export const FETCH_COMMENT_TOPIC_TYPES_ACTION = 'comment/FETCH_COMMENT_TOPIC_TYPES_ACTION';
export const FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION = 'comment/FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION';

export const UPDATE_COMMENT_TOPIC_TYPE_ACTION = 'comment/UPDATE_COMMENT_TOPIC_TYPE_ACTION';
export const UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION = 'comment/UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION';

export const DELETE_COMMENT_TOPIC_TYPE_ACTION = 'comment/DELETE_COMMENT_TOPIC_TYPE_ACTION';
export const DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION = 'comment/DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION';

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

export type CommentActionTypes =
  | FetchCommentTopicTypesSuccessAction
  | FetchCommentTopicTypesAction
  | DeleteCommentTopicTypeAction
  | DeleteCommentTopicTypeSuccessAction
  | UpdateCommentTopicTypesAction
  | UpdateCommentTopicTypesSuccessAction;

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
