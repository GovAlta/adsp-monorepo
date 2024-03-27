export enum Rating {
  'terrible' = 0,
  'bad' = 1,
  'neutral' = 2,
  'good' = 3,
  'delightful' = 4,
}

interface FeedbackContext {
  site: string;
  view: string;
  correlationId: string;
}

export interface Feedback {
  context: FeedbackContext;
  rating: Rating;
  comment: string;
}
