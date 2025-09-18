import {
  FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION,
  UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  CREATE_COMMENT_TOPIC_SUCCESS_ACTION,
  FETCH_COMMENT_COMMENTS_SUCCESS,
  SET_COMMENT_TOPICS_ACTION,
  CREATE_COMMENT_COMMENTS_SUCCESS,
  DELETE_COMMENT_TOPIC_SUCCESS,
  DELETE_COMMENT_COMMENTS_SUCCESS,
  CommentActionTypes,
  UPDATE_COMMENT_COMMENTS_SUCCESS,
  FETCH_COMMENT_METRICS_SUCCEEDED,
} from './action';

import { CommentState } from './model';

function updateSpecifiedCommentType(comments, comment) {
  const index = comments.findIndex(({ id }) => id === comment.id);
  const newComments = comments.map((x) => Object.assign({}, x));
  newComments[index] = comment;
  return newComments;
}

export const defaultState: CommentState = {
  topicTypes: [],
  core: [],
  topics: [],
  comments: [],
  nextEntries: null,
  nextCommentEntries: null,
  metrics: {},
};

export default function (state: CommentState = defaultState, action: CommentActionTypes): CommentState {
  switch (action.type) {
    case FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION:
      return {
        ...state,
        topicTypes: action.payload.types.TopicTypes,
        core: action.payload.types.core,
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
        topics: [...state.topics, action.payload].slice(0, 10),
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

    case CREATE_COMMENT_COMMENTS_SUCCESS:
      return {
        ...state,
        comments: [action.payload, ...state.comments],
      };
    case UPDATE_COMMENT_COMMENTS_SUCCESS:
      return {
        ...state,
        comments: updateSpecifiedCommentType(state.comments, action.payload),
      };

    case FETCH_COMMENT_COMMENTS_SUCCESS:
      return {
        ...state,
        comments:
          action.after && action.after !== ''
            ? [...state.comments, ...action.payload]
            : action.payload
            ? action.payload
            : state.comments,
        nextCommentEntries: action.next,
      };

    case DELETE_COMMENT_TOPIC_SUCCESS: {
      const newTopicList = [...state.topics];
      const index = newTopicList.findIndex((comment) => comment.id === action.payload);

      if (index !== -1) {
        newTopicList.splice(index, 1);
      }
      return {
        ...state,
        topics: newTopicList,
      };
    }
    case DELETE_COMMENT_COMMENTS_SUCCESS:
      // eslint-disable-next-line no-case-declarations
      const filteredComments = state.comments.filter((comment) => comment.id !== action.payload.comment);
      return {
        ...state,
        comments: filteredComments,
      };
    case FETCH_COMMENT_METRICS_SUCCEEDED:
      return {
        ...state,
        metrics: action.payload,
      };
    default:
      return state;
  }
}
