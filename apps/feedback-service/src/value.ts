import { AdspId, ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { FeedbackValue, Rating, ValueService } from './feedback';

const VALUE_API_ID = adspId`urn:ads:platform:value-service:v1`;

class ValueServiceImpl implements ValueService {
  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  async writeValue(tenantId: AdspId, { timestamp, digest, context, ...feedback }: FeedbackValue): Promise<void> {
    try {
      const valueApiUrl = await this.directory.getServiceUrl(VALUE_API_ID);

      const token = await this.tokenProvider.getAccessToken();
      axios.post(
        new URL('v1/feedback-service/values/feedback', valueApiUrl).href,
        {
          timestamp,
          correlationId: context.correlationId || `${context.site}:${context.view}`,
          context: {
            ...context,
            digest,
          },
          value: feedback,
          metrics: {
            [`${context.site}:count`]: 1,
            [`${context.site}:${context.view}:count`]: 1,
            [`${context.site}:rating`]: Rating[feedback.rating],
            [`${context.site}:${context.view}:rating`]: Rating[feedback.rating],
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
}

interface ValueServiceProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}
export function createValueService({ logger, directory, tokenProvider }: ValueServiceProps) {
  return new ValueServiceImpl(logger, directory, tokenProvider);
}
