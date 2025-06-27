import { AdspId, ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { FeedbackValue, FeedbackResponse, Rating, ValueService, FeedbackEntry } from './feedback';

const VALUE_API_ID = adspId`urn:ads:platform:value-service:v1`;

class ValueServiceImpl implements ValueService {
  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  async writeValue(tenantId: AdspId, { timestamp, digest, context, ...feedback }: FeedbackValue): Promise<void> {
    try {
      const ratingValue = Rating[feedback.rating];

      const valueApiUrl = await this.directory.getServiceUrl(VALUE_API_ID);
      const token = await this.tokenProvider.getAccessToken();
      await axios.post(
        new URL('v1/feedback-service/values/feedback', valueApiUrl).href,
        {
          timestamp,
          correlationId: context.correlationId || `${context.site}${context.view}`,
          context: {
            ...context,
            digest,
            includesComment: !!feedback.comment,
            includesTechnicalIssue: !!feedback.technicalIssue,
          },
          value: { ...feedback, ratingValue },
          metrics: {
            [`${context.site}:count`]: 1,
            [`${context.site}:${context.view}:count`]: 1,
            [`${context.site}:rating`]: ratingValue,
            [`${context.site}:${context.view}:rating`]: ratingValue,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId.toString() },
        }
      );
    } catch (err) {
      this.logger.warn(`Error encountered writing feedback value. ${err}`, {
        context: 'ValueService',
        tenant: tenantId,
      });
      throw err;
    }
  }

  async readValues(tenantId: AdspId, site: string, top: number, after: string): Promise<FeedbackResponse> {
    try {
      const valueApiUrl = await this.directory.getServiceUrl(VALUE_API_ID);
      const token = await this.tokenProvider.getAccessToken();
      const path = 'v1/feedback-service/values/feedback';
      const query = encodeURIComponent(`top=${top}&after=${after}&context={"site":"${site}"}`);
      const { data } = await axios.get(new URL(`${path}?${query}`, valueApiUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: tenantId.toString() },
      });
      console.dir(data, { depth: 10 });
      return this.incrementRatingValues(data);
    } catch (err) {
      this.logger.warn(`Error encountered reading feedback values. ${err}`, {
        context: 'ValueService',
        tenant: tenantId,
      });
      throw err;
    }
  }

  incrementRatingValues = (feedbackResponse: FeedbackResponse): FeedbackResponse => {
    const { feedback } = feedbackResponse['feedback-service'];
    return {
      'feedback-service': {
        feedback: feedback.map(this.incrementRatingValue),
      },
      page: feedbackResponse.page,
    };
  };

  incrementRatingValue = (feedbackEntry: FeedbackEntry): FeedbackEntry => {
    const entry = feedbackEntry;
    entry.value.ratingValue = entry.value.ratingValue + 1;
    return entry;
  };
}

interface ValueServiceProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}
export function createValueService({ logger, directory, tokenProvider }: ValueServiceProps) {
  return new ValueServiceImpl(logger, directory, tokenProvider);
}
