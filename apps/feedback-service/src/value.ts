import { AdspId, ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { FeedbackValue, FeedbackResponse, Rating, ValueService, FeedbackEntry, ReadQueryParameters } from './feedback';

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

  async readValues(tenantId: AdspId, queryParameters: ReadQueryParameters): Promise<FeedbackResponse> {
    try {
      const valueApiUrl = await this.directory.getServiceUrl(VALUE_API_ID);
      const token = await this.tokenProvider.getAccessToken();
      const path = 'v1/feedback-service/values/feedback';
      const url = this.composeUri(path, queryParameters);
      const { data } = await axios.get(new URL(url, valueApiUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: tenantId.toString() },
      });
      return this.incrementRatingValues(data);
    } catch (err) {
      this.logger.warn(`Error encountered reading feedback values. ${err}`, {
        context: 'ValueService',
        tenant: tenantId,
      });
      throw err;
    }
  }

  composeUri = (path: string, queryParameters: ReadQueryParameters): string => {
    let query = `top=${queryParameters.top}&context={"site":"${queryParameters.site}"}`;
    if (queryParameters.after) {
      query = `${query}&after=${encodeURIComponent(queryParameters.after)}`;
    }
    if (queryParameters.start) {
      query = `${query}&timestampMin=${encodeURIComponent(queryParameters.start)}`;
    }
    if (queryParameters.end) {
      query = `${query}&timestampMax=${encodeURIComponent(queryParameters.end)}`;
    }
    return `${path}?${query}`;
  };

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
