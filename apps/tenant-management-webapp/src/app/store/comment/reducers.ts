import {
  FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION,
  UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  CREATE_COMMENT_TOPIC_SUCCESS_ACTION,
  FETCH_COMMENT_COMMENTS_SUCCESS,
  SET_COMMENT_TOPICS_ACTION,
  CREAT_COMMENT_COMMENTS_SUCCESS,
  DELETE_COMMENT_TOPIC_SUCCESS,
  DELETE_COMMENT_COMMENTS_SUCCESS,
  CommentActionTypes,
  UPDATE_COMMENT_COMMENTS_SUCCESS,
} from './action';

import { CommentState } from './model';

function updateSpecifiedCommentType(comments, comment) {
  const index = comments.findIndex(({ id }) => id === comment.id);
  const newComments = comments.map((x) => Object.assign({}, x));
  newComments[index] = comment;
  return newComments;
}

export const defaultState: CommentState = {
  topicTypes: {},
  topics: [],
  comments: [],
  nextEntries: null,
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
          ...state.topicTypes,
          ...action.payload,
        },
      };

    case DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION:
      return {
        ...state,
        topicTypes: { ...state.topicTypes },
      };

    case CREATE_COMMENT_TOPIC_SUCCESS_ACTION:
      return {
        ...state,
        topics: [...state.topics, action.payload],
      };

    case SET_COMMENT_TOPICS_ACTION:
      return {
        ...state,
        topics:
          action.after && action.after !== ''
            ? [...state.topics, ...action.payload]
            : action.payload
            ? action.payload
            : state.topics,
        nextEntries: action.next,
      };

    case CREAT_COMMENT_COMMENTS_SUCCESS:
      return {
        ...state,
        comments: [...state.comments, action.payload],
      };
    case UPDATE_COMMENT_COMMENTS_SUCCESS:
      return {
        ...state,
        comments: updateSpecifiedCommentType(state.comments, action.payload),
      };

    case FETCH_COMMENT_COMMENTS_SUCCESS:
      return {
        ...state,
        comments: action.payload,
      };

    case DELETE_COMMENT_TOPIC_SUCCESS:
      return {
        ...state,
      };

    case DELETE_COMMENT_COMMENTS_SUCCESS:
      // eslint-disable-next-line no-case-declarations
      const filteredComments = state.comments.filter((comment) => comment.id !== parseInt(action.payload));
      return {
        ...state,
        comments: { ...filteredComments },
      };

    default:
      return state;
  }
}
