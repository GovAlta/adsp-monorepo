import { FeedbackState } from './models';
import {
  DELETE_FEEDBACK_SITE_SUCCESS_ACTION,
  FETCH_FEEDBACK_SITES_SUCCESS_ACTION,
  FeedbackActionTypes,
  UPDATE_FEEDBACK_SITE_SUCCESS_ACTION,
} from './actions';

export const initialState: FeedbackState = {
  sites: [],
  isLoading: false,
};

function feedbackReducer(state: FeedbackState = initialState, action: FeedbackActionTypes): FeedbackState {
  switch (action.type) {
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
