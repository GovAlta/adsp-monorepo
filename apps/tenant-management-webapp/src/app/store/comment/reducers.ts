import {
  FETCH_COMMENT_TOPIC_TYPES_SUCCESS_ACTION,
  UPDATE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  DELETE_COMMENT_TOPIC_TYPE_SUCCESS_ACTION,
  ADD_TOPIC_SUCCESS,
  SET_TOPICS,
  ADD_COMMENT_SUCCESS,
  DELETE_TOPIC_SUCCESS,
  DELETE_COMMENT_SUCCESS,
  CommentActionTypes,
} from './action';

import { CommentState, CommentTopicTypes, Topic, Comment } from './model';

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

    case ADD_TOPIC_SUCCESS:
      return {
        ...state,
        topics: { ...state.topics, ...action.payload },
      };

    case SET_TOPICS:
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

    case ADD_COMMENT_SUCCESS:
      return {
        ...state,
        comments: { ...state.comments },
      };

    case DELETE_TOPIC_SUCCESS:
      return {
        ...state,
        //topics: state.topics.filter((topic) => topic.resultsid !== action.payload),
      };

    case DELETE_COMMENT_SUCCESS:
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
