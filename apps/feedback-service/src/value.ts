import { AdspId, ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import {
  FeedbackValue,
  FeedbackResponse,
  Rating,
  ValueService,
  FeedbackEntry,
  FeedbackSummary,
  FeedbackSummaryQueryParameters,
  ReadQueryParameters,
  ValueResponse,
} from './feedback';

const VALUE_API_ID = adspId`urn:ads:platform:value-service:v1`;
type ValueRequestConfig = { headers: { Authorization: string }; params: { tenantId: string } };

class ValueServiceImpl implements ValueService {
  constructor(
    private logger: Logger,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
  ) {}

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
        },
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
        params: { tenantId: tenantId?.toString() },
      });
      const result = this.incrementRatingValues(data);
      return result as FeedbackResponse;
    } catch (err) {
      this.logger.warn(`Error encountered reading feedback values. ${err}`, {
        context: 'ValueService',
        tenant: tenantId,
      });
      throw err;
    }
  }

  async readSummary(tenantId: AdspId, queryParameters: FeedbackSummaryQueryParameters): Promise<FeedbackSummary> {
    try {
      const valueApiUrl = await this.directory.getServiceUrl(VALUE_API_ID);
      const token = await this.tokenProvider.getAccessToken();
      const requestConfig = {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: tenantId.toString() },
      };
      const countUrl = new URL('v1/feedback-service/values/feedback/count', valueApiUrl).href;
      const ratingUrl = new URL('v1/feedback-service/values/feedback/metrics', valueApiUrl).href;
      const ratingMetric = `${queryParameters.site}:rating`;
      const metricCriteria = JSON.stringify(this.getMetricCriteria(queryParameters, ratingMetric));

      const [counts, ratingTotals] = await Promise.all([
        this.readSummaryCounts(countUrl, requestConfig, queryParameters),
        this.readRatingTotals(ratingUrl, requestConfig, metricCriteria, ratingMetric),
      ]);

      const averageRating =
        counts.totalResponses > 0 && ratingTotals.count > 0
          ? Math.round((ratingTotals.sum / ratingTotals.count + 1) * 10) / 10
          : null;

      return { ...counts, averageRating };
    } catch (err) {
      this.logger.warn(`Error encountered reading feedback summary. ${err}`, {
        context: 'ValueService',
        tenant: tenantId,
      });
      throw err;
    }
  }

  private async readSummaryCounts(
    url: string,
    requestConfig: ValueRequestConfig,
    queryParameters: FeedbackSummaryQueryParameters,
  ) {
    const criteria = this.getValueCriteria(queryParameters);
    const count = (context: Record<string, unknown>) =>
      axios.get(url, {
        ...requestConfig,
        params: { ...requestConfig.params, ...criteria, context: JSON.stringify(context) },
      });
    const [total, comments, issues] = await Promise.all([
      count({ site: queryParameters.site }),
      count({ site: queryParameters.site, includesComment: true }),
      count({ site: queryParameters.site, includesTechnicalIssue: true }),
    ]);

    return {
      totalResponses: total.data?.count ?? 0,
      responsesWithComments: comments.data?.count ?? 0,
      responsesWithIssues: issues.data?.count ?? 0,
    };
  }

  private async readRatingTotals(url: string, requestConfig: ValueRequestConfig, criteria: string, metric: string) {
    let after: string | undefined;
    let totals = { sum: 0, count: 0 };

    do {
      const { data } = await axios.get(url, {
        ...requestConfig,
        params: { ...requestConfig.params, top: 5000, interval: 'daily', criteria, after },
      });
      totals = (data?.[metric]?.values ?? []).reduce(
        (result, value) => ({
          sum: result.sum + Number(value.sum || 0),
          count: result.count + Number(value.count || 0),
        }),
        totals,
      );
      after = data?.page?.next;
    } while (after);

    return totals;
  }

  private getValueCriteria(queryParameters: FeedbackSummaryQueryParameters) {
    return {
      context: JSON.stringify({ site: queryParameters.site }),
      ...(queryParameters.start ? { timestampMin: queryParameters.start } : {}),
      ...(queryParameters.end ? { timestampMax: queryParameters.end } : {}),
    };
  }

  private getMetricCriteria(queryParameters: FeedbackSummaryQueryParameters, metric: string) {
    const intervalMax = queryParameters.end ? new Date(queryParameters.end).getTime() + 1 : Date.now();
    return {
      metricLike: metric,
      intervalMin: queryParameters.start ?? new Date(0).toISOString(),
      intervalMax: new Date(intervalMax).toISOString(),
    };
  }

  composeUri = (path: string, queryParameters: ReadQueryParameters): string => {
    let query = `top=${queryParameters.top}`;
    if (queryParameters.site) {
      query = `${query}&context={"site":"${queryParameters.site}"}`;
    }
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

  incrementRatingValues = (feedbackResponse: ValueResponse): FeedbackResponse => {
    const { feedback } = feedbackResponse['feedback-service'];
    return {
      feedback: feedback.map(this.incrementRatingValue),
      page: feedbackResponse.page,
    };
  };

  incrementRatingValue = (feedbackEntry: FeedbackEntry): FeedbackEntry => {
    const entry = { ...feedbackEntry, value: { ...feedbackEntry.value } };
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
