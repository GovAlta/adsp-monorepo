export interface Feedback {
  timestamp: Date;
  correlationId: string;
  context: Context;
  value: Value;
}

export interface Context {
  site: string;
  view: string;
  digest: string;
  includesComment: boolean;
}

export interface Value {
  rating: Rating;
  comment: string;
  technicalIssue: string;
  ratingValue: number;
}

export enum Rating {
  'terrible' = 1,
  'bad' = 2,
  'neutral' = 3,
  'good' = 4,
  'delightful' = 5,
}

export interface Page {
  next: string;
  size: number;
}
export interface FeedbackSite {
  url: string;
  allowAnonymous: boolean;
  tags?: string[];
}
export interface SelectedSite {
  site: string;
}

export interface FeedbackMetrics {
  averageRating?: number;
  lowestSiteAverageRating?: number;
  feedbackCount?: number;
  momCountPercent?: number | null;
  momAvgRatingPercent?: number | null;
  momLowestRatingPercent?: number | null;
}

export interface FeedbackState {
  sites: FeedbackSite[];
  feedbacks: Feedback[];
  exportData: Feedback[];
  isLoading: boolean;
  nextEntries: string;
  metrics: FeedbackMetrics;
}

export interface FeedbackSearchCriteria {
  startDate?: string;
  endDate?: string;
  isExport?: boolean;
}

export const getDefaultSearchCriteria = (): FeedbackSearchCriteria => {
  const start = new Date();
  start.setHours(24, 0, 0, 0);
  const end = new Date();
  end.setHours(24, 0, 0, 0);

  return {
    // using absolute unit time will be more intuitive than using setDate;
    startDate: new Date(start.setFullYear(start.getFullYear() - 1)).toISOString(),
    endDate: end.toISOString(),
  };
};

export const defaultFeedbackSite: FeedbackSite = {
  url: '',
  allowAnonymous: false,
  tags: [],
};
