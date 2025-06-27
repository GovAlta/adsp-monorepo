import { AdspId, ValueDefinition } from '@abgov/adsp-service-sdk';
import { Feedback } from './types';

const FEEDBACK_VALUE = 'feedback';
export const FeedbackValueDefinition: ValueDefinition = {
  id: 'feedback',
  name: FEEDBACK_VALUE,
  description: 'Value representing received feedback.',
  jsonSchema: {
    type: 'object',
    properties: {
      rating: {
        type: 'string',
      },
      ratingValue: {
        type: 'number',
      },
      comment: {
        type: ['string', 'null'],
      },
      technicalIssue: {
        type: ['string', 'null'],
      },
    },
    required: ['rating', 'ratingValue'],
  },
};

export interface FeedbackValue extends Feedback {
  timestamp: Date;
  digest: string;
}

// Returned by the value service.
export type FeedbackResponse = {
  'feedback-service': {
    feedback: FeedbackEntry[];
  };
  page: {
    after?: string;
    next?: string;
    size: number;
  };
};

export type FeedbackEntry = {
  timestamp: string;
  correlationId: string;
  context: {
    site: string;
    view: string;
    digest: string;
    includesComment: boolean;
    includesTechnicalIssue: boolean;
  };
  value: {
    rating: string;
    comment: string;
    ratingValue: number;
    technicalIssue: string;
  };
};

export interface ValueService {
  writeValue(tenantId: AdspId, value: FeedbackValue): Promise<void>;
  readValues(tenantId: AdspId, site: string, top: number, after: string | undefined): Promise<FeedbackResponse>;
}
