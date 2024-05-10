export interface FeedbackSite {
  url: string;
  allowAnonymous: boolean;
  views?: [];
}

export interface FeedbackState {
  sites: FeedbackSite[];
  isLoading: boolean;
}

export const defaultFeedbackSite: FeedbackSite = {
  url: '',
  allowAnonymous: false,
  views: [],
};
