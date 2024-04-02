import { AdspId, ValueDefinition } from '@abgov/adsp-service-sdk';
import { Feedback } from './types';

const FEEDBACK_VALUE = 'feedback';
export const FeedbackValueDefinition: ValueDefinition = {
  id: 'feedback',
  name: FEEDBACK_VALUE,
  description: 'Value representing received feedback.',
  jsonSchema: {},
};

export interface FeedbackValue extends Feedback {
  timestamp: Date;
  digest: string;
}

export interface ValueService {
  writeValue(tenantId: AdspId, value: FeedbackValue): Promise<void>;
}
