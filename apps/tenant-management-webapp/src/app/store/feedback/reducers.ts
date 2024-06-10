import { FeedbackState } from './models';
import {
  FETCH_FEEDBACKS_ACTION,
  FETCH_FEEDBACKS_SUCCESS_ACTION,
  DELETE_FEEDBACK_SITE_SUCCESS_ACTION,
  FETCH_FEEDBACK_SITES_SUCCESS_ACTION,
  FeedbackActionTypes,
  UPDATE_FEEDBACK_SITE_SUCCESS_ACTION,
} from './actions';

export const initialState: FeedbackState = {
  feedbacks: [],
  sites: [],
  isLoading: false,
  nextEntries: null,
};

function feedbackReducer(state: FeedbackState = initialState, action: FeedbackActionTypes): FeedbackState {
  switch (action.type) {
    case FETCH_FEEDBACKS_SUCCESS_ACTION: {
      return {
        ...state,
        feedbacks:
          action.after && action.after !== ''
            ? [...state.feedbacks, ...action.payload]
            : action.payload
            ? action.payload
            : state.feedbacks,
        nextEntries: action.next,
      };
    }
    case FETCH_FEEDBACKS_ACTION: {
      return {
        ...state,
      };
    }
    case FETCH_FEEDBACK_SITES_SUCCESS_ACTION: {
      return {
        ...state,
        sites: action.results,
      };
    }
    case UPDATE_FEEDBACK_SITE_SUCCESS_ACTION: {
      return {
        ...state,
        sites: action.sites,
      };
    }
    case DELETE_FEEDBACK_SITE_SUCCESS_ACTION: {
      return {
        ...state,
        sites: state.sites.filter((site) => site.url !== action.siteUrl),
      };
    }
    default:
      return state;
  }
}

export default feedbackReducer;
