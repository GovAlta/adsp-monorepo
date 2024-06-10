import { Feedback, FeedbackSite } from './models';

export const FETCH_FEEDBACKS_ACTION = 'feedback/FETCH_FEEDBACKS_ACTION';
export const FETCH_FEEDBACKS_SUCCESS_ACTION = 'feedback/FETCH_FEEDBACKS_SUCCESS_ACTION';

export const FETCH_FEEDBACK_SITES_ACTION = 'feedback/FETCH_FEEDBACK_SITES_ACTION';
export const FETCH_FEEDBACK_SITES_SUCCESS_ACTION = 'feedback/FETCH_FEEDBACK_SITES_SUCCESS_ACTION';

export const UPDATE_FEEDBACK_SITE_ACTION = 'feedback/UPDATE_FEEDBACK_SITE_ACTION';
export const UPDATE_FEEDBACK_SITE_SUCCESS_ACTION = 'feedback/UPDATE_FEEDBACK_SITE_SUCCESS_ACTION';

export const DELETE_FEEDBACK_SITE_ACTION = 'feedback/DELETE_FEEDBACK_SITE_ACTION';
export const DELETE_FEEDBACK_SITE_SUCCESS_ACTION = 'feedback/DELETE_FEEDBACK_SITE_SUCCESS_ACTION';

export interface FetchFeedbacksAction {
  type: typeof FETCH_FEEDBACKS_ACTION;
  feedback: FeedbackSite;
  next: string;
}
export interface FetchFeedbacksSuccessAction {
  type: typeof FETCH_FEEDBACKS_SUCCESS_ACTION;
  payload: Feedback[];
  after: string;
  next: string;
}
export interface FetchFeedbackSitesAction {
  type: typeof FETCH_FEEDBACK_SITES_ACTION;
}
export interface FetchFeedbackSitesSuccessAction {
  type: typeof FETCH_FEEDBACK_SITES_SUCCESS_ACTION;
  results: FeedbackSite[];
}

export interface UpdateFeedbackSiteAction {
  type: typeof UPDATE_FEEDBACK_SITE_ACTION;
  site: FeedbackSite;
}

export interface UpdateFeedbackSiteSuccessAction {
  type: typeof UPDATE_FEEDBACK_SITE_SUCCESS_ACTION;
  sites: FeedbackSite[];
}

export interface DeleteFeedbackSiteAction {
  type: typeof DELETE_FEEDBACK_SITE_ACTION;
  site: FeedbackSite;
}

export interface DeleteFeedbackSiteSuccessAction {
  type: typeof DELETE_FEEDBACK_SITE_SUCCESS_ACTION;
  siteUrl: string;
}

export type FeedbackActionTypes =
  | FetchFeedbacksAction
  | FetchFeedbacksSuccessAction
  | FetchFeedbackSitesAction
  | FetchFeedbackSitesSuccessAction
  | UpdateFeedbackSiteAction
  | UpdateFeedbackSiteSuccessAction
  | DeleteFeedbackSiteAction
  | DeleteFeedbackSiteSuccessAction;

export const getFeedbacks = (payload: FeedbackSite, next?: string): FetchFeedbacksAction => ({
  type: FETCH_FEEDBACKS_ACTION,
  feedback: payload,
  next,
});

export const getFeedbacksSuccess = (results: Feedback[], after: string, next: string): FetchFeedbacksSuccessAction => ({
  type: FETCH_FEEDBACKS_SUCCESS_ACTION,
  payload: results,
  after,
  next,
});
export const getFeedbackSites = (): FetchFeedbackSitesAction => ({
  type: FETCH_FEEDBACK_SITES_ACTION,
});
export const getFeedbackSitesSuccess = (results: FeedbackSite[]): FetchFeedbackSitesSuccessAction => ({
  type: FETCH_FEEDBACK_SITES_SUCCESS_ACTION,
  results,
});

export const updateFeedbackSite = (site: FeedbackSite): UpdateFeedbackSiteAction => ({
  type: UPDATE_FEEDBACK_SITE_ACTION,
  site,
});

export const updateFeedbackSiteSuccess = (sites: FeedbackSite[]): UpdateFeedbackSiteSuccessAction => ({
  type: UPDATE_FEEDBACK_SITE_SUCCESS_ACTION,
  sites,
});

export const deleteFeedbackSite = (site: FeedbackSite): DeleteFeedbackSiteAction => ({
  type: DELETE_FEEDBACK_SITE_ACTION,
  site,
});

export const deleteFeedbackSiteSuccess = (siteUrl: string): DeleteFeedbackSiteSuccessAction => ({
  type: DELETE_FEEDBACK_SITE_SUCCESS_ACTION,
  siteUrl,
});
