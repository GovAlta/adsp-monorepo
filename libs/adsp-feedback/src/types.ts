export interface FeedbackContext {
  tenant?: string;
  site: string;
  view: string;
  correlationId?: string;
}

export interface FeedbackOptions {
  tenant?: string;
  name?: string;
  email?: string;
  site?: string;
  apiUrl?: string;
  getAccessToken?: () => Promise<string>;
  getContext?: () => Promise<FeedbackContext>;
}

export interface AdspFeedback {
  initialize(options: FeedbackOptions): void;
}

declare global {
  // eslint-disable-next-line no-var
  var adspFeedback: AdspFeedback;
}
