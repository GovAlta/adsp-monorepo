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
}

export enum Rating {
  'terrible' = 0,
  'bad' = 1,
  'neutral' = 2,
  'good' = 3,
  'delightful' = 4,
}

export interface Page {
  next: string;
  size: number;
}
export interface FeedbackSite {
  url: string;
  allowAnonymous: boolean;
}
export interface SelectedSite {
  site: string;
}

export interface FeedbackState {
  sites: FeedbackSite[];
  feedbacks: Feedback[];
  exportData: Feedback[];
  isLoading: boolean;
  nextEntries: string;
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
};
