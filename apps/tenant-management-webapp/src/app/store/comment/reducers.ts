import {
  FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION,
  UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  CommentActionTypes,
} from './action';

import { CommentState } from './model';

export const defaultState: CommentState = {
  topicTypes: {},
};

export default function (state: CommentState = defaultState, action: CommentActionTypes): CommentState {
  switch (action.type) {
    case FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION:
      return {
        ...state,
        topicTypes: action.payload,
      };

    case UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION:
      return {
        ...state,
        topicTypes: {
          ...action.payload,
        },
      };

    case DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION:
      return {
        ...state,
        topicTypes: {
          ...action.payload,
        },
      };

    default:
      return state;
  }
}
