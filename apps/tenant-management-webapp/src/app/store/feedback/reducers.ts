import { FeedbackState } from './models';
import {
  FETCH_FEEDBACKS_ACTION,
  FETCH_FEEDBACKS_SUCCESS_ACTION,
  DELETE_FEEDBACK_SITE_SUCCESS_ACTION,
  FETCH_FEEDBACK_SITES_SUCCESS_ACTION,
  FeedbackActionTypes,
  UPDATE_FEEDBACK_SITE_SUCCESS_ACTION,
  EXPORT_FEEDBACKS_SUCCESS_ACTION,
  FETCH_FEEDBACK_METRICS_SUCCESS_ACTION,
  FETCH_FEEDBACK_METRICS_MONTHLY_CHANGE_SUCCESS_ACTION,
  FETCH_FEEDBACK_SUMMARY_ACTION,
  FETCH_FEEDBACK_SUMMARY_SUCCESS_ACTION,
  CLEAR_FEEDBACK_SUMMARY_ACTION,
} from './actions';

export const initialState: FeedbackState = {
  feedbacks: [],
  sites: [],
  exportData: [],
  isLoading: false,
  page: null,
  metrics: {},
  summary: null,
};

function feedbackReducer(state: FeedbackState = initialState, action: FeedbackActionTypes): FeedbackState {
  switch (action.type) {
    case FETCH_FEEDBACKS_SUCCESS_ACTION: {
      return {
        ...state,
        feedbacks: action.payload,
        page: {
          page: action.page,
          pageSize: action.pageSize,
          total: action.total ?? state.page?.total ?? 0,
        },
      };
    }
    case EXPORT_FEEDBACKS_SUCCESS_ACTION: {
      return {
        ...state,
        exportData: action.exportData,
      };
    }
    case FETCH_FEEDBACKS_ACTION: {
      return {
        ...state,
      };
    }
    case FETCH_FEEDBACK_SUMMARY_ACTION:
    case CLEAR_FEEDBACK_SUMMARY_ACTION: {
      return {
        ...state,
        summary: null,
      };
    }
    case FETCH_FEEDBACK_SUMMARY_SUCCESS_ACTION: {
      return {
        ...state,
        summary: action.summary,
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
    case FETCH_FEEDBACK_METRICS_SUCCESS_ACTION: {
      return {
        ...state,
        metrics: {
          ...state.metrics,
          ...action.metrics,
        },
      };
    }
    case FETCH_FEEDBACK_METRICS_MONTHLY_CHANGE_SUCCESS_ACTION: {
      return {
        ...state,
        metrics: {
          ...state.metrics,
          ...action.metrics,
        },
      };
    }

    default:
      return state;
  }
}

export default feedbackReducer;
