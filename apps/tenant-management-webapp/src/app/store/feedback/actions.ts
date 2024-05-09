import { FeedbackSite } from './models';

export const FETCH_FEEDBACK_SITES_ACTION = 'feedback/FETCH_FEEDBACK_SITES_ACTION';
export const FETCH_FEEDBACK_SITES_SUCCESS_ACTION = 'feedback/FETCH_FEEDBACK_SITES_SUCCESS_ACTION';

export const UPDATE_FEEDBACK_SITE_ACTION = 'feedback/UPDATE_FEEDBACK_SITE_ACTION';
export const UPDATE_FEEDBACK_SITE_SUCCESS_ACTION = 'feedback/UPDATE_FEEDBACK_SITE_SUCCESS_ACTION';

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

export type FeedbackActionTypes =
  | FetchFeedbackSitesAction
  | FetchFeedbackSitesSuccessAction
  | UpdateFeedbackSiteAction
  | UpdateFeedbackSiteSuccessAction;

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
