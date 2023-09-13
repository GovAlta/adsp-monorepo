import { CommentTopicTypes } from './model';

export const FETCH_COMMENT_TOPIC_TYPES_ACTION = 'form/FETCH_COMMENT_TOPIC_TYPES_ACTION';
export const FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION = 'form/FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION';

export const UPDATE_COMMENT_TOPIC_TYPE_ACTION = 'form/UPDATE_COMMENT_TOPIC_TYPE_ACTION';
export const UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION = 'form/UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION';

export interface FetchCommentTopicTypesAction {
  type: typeof FETCH_COMMENT_TOPIC_TYPES_ACTION;
}

export interface FetchCommentTopicTypesSuccessAction {
  type: typeof FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION;
  payload: Record<string, CommentTopicTypes>;
}

export interface UpdateCommentTopicTypesAction {
  type: typeof UPDATE_COMMENT_TOPIC_TYPE_ACTION;
  definition: CommentTopicTypes;
  options?: string;
}

export interface UpdateCommentTopicTypesSuccessAction {
  type: typeof UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION;
  payload: Record<string, CommentTopicTypes>;
}

export type CommentActionTypes =
  | FetchCommentTopicTypesSuccessAction
  | FetchCommentTopicTypesAction
  | UpdateCommentTopicTypesAction
  | UpdateCommentTopicTypesSuccessAction;

export const updateCommentTopicType = (
  definition: CommentTopicTypes,
  options?: string
): UpdateCommentTopicTypesAction => ({
  type: UPDATE_COMMENT_TOPIC_TYPE_ACTION,
  definition,
  options,
});

export const updateCommentTopicTypesSuccess = (
  definition: Record<string, CommentTopicTypes>
): UpdateCommentTopicTypesSuccessAction => ({
  type: UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  payload: definition,
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
