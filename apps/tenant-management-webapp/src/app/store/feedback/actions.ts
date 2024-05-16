import { FeedbackSite } from './models';

export const FETCH_FEEDBACK_SITES_ACTION = 'feedback/FETCH_FEEDBACK_SITES_ACTION';
export const FETCH_FEEDBACK_SITES_SUCCESS_ACTION = 'feedback/FETCH_FEEDBACK_SITES_SUCCESS_ACTION';

export const UPDATE_FEEDBACK_SITE_ACTION = 'feedback/UPDATE_FEEDBACK_SITE_ACTION';
export const UPDATE_FEEDBACK_SITE_SUCCESS_ACTION = 'feedback/UPDATE_FEEDBACK_SITE_SUCCESS_ACTION';

export const DELETE_FEEDBACK_SITE_ACTION = 'feedback/DELETE_FEEDBACK_SITE_ACTION';
export const DELETE_FEEDBACK_SITE_SUCCESS_ACTION = 'feedback/DELETE_FEEDBACK_SITE_SUCCESS_ACTION';

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
  | FetchFeedbackSitesAction
  | FetchFeedbackSitesSuccessAction
  | UpdateFeedbackSiteAction
  | UpdateFeedbackSiteSuccessAction
  | DeleteFeedbackSiteAction
  | DeleteFeedbackSiteSuccessAction;

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
