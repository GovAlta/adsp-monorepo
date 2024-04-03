import { AdspId, ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { PiiService } from './feedback';
import axios from 'axios';

const PII_API_ID = adspId`urn:ads:platform:pii-service:v1`;

class PiiServiceImpl implements PiiService {
  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  async anonymize(tenantId: AdspId, text: string): Promise<string> {
    try {
      const piiApiUrl = await this.directory.getServiceUrl(PII_API_ID);

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ text: string }>(
        new URL('v1/anonymize', piiApiUrl).href,
        {
          text,
          language: 'en',
          score_threshold: 0.3,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId.toString() },
        }
      );

      return data.text;
    } catch (err) {
      this.logger.warn(`Error encountered anonymizing text. ${err}`, {
        context: 'PiiService',
        tenant: tenantId,
      });
      throw err;
    }
  }
}

interface PiiServiceProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export function createPiiService({ logger, directory, tokenProvider }: PiiServiceProps) {
  return new PiiServiceImpl(logger, directory, tokenProvider);
}
