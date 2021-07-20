import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as NodeCache from 'node-cache';
import { JsonObject } from 'swagger-ui-express';
import { Logger } from 'winston';

interface ServiceDoc {
  service: {
    id: AdspId;
    name: string;
  };
  docs: JsonObject;
  url: string;
}

export interface ServiceDocs {
  getDocs(): Promise<Record<string, ServiceDoc>>;
}

class ServiceDocsImpl {
  private readonly cache = new NodeCache({
    stdTTL: 3600,
  });

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider
  ) {}

  #retrieveDocs = async (): Promise<Record<string, ServiceDoc>> => {
    this.logger.debug('Retrieving service API docs...');

    const configurationServiceUrl = await this.directory.getServiceUrl(
      adspId`urn:ads:platform:configuration-service:v1`
    );
    const optionsUrl = new URL('v1/serviceOptions?top=100', configurationServiceUrl);

    const token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.get<{ results: { service: string; version: string; displayName: string }[] }>(
      optionsUrl.href,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const docs = {} as Record<string, ServiceDoc>;
    for (const { service, version, displayName } of data.results) {
      if (version === 'v1') {
        try {
          const serviceId = adspId`urn:ads:platform:${service}`;
          this.logger.debug(`Retrieving API docs for service ${serviceId} ...`);

          const serviceUrl = await this.directory.getServiceUrl(serviceId);
          const docUrl = new URL('swagger/docs/v1', serviceUrl);

          const { data } = await axios.get(docUrl.href);

          if (data.openapi) {
            data.servers = [{ url: serviceUrl.href }];
            docs[service] = {
              service: {
                id: serviceId,
                name: displayName,
              },
              docs: data,
              url: docUrl.href,
            };
          }
        } catch (err) {
          this.logger.warn(`Error encountered in getting docs for ${service}. ${err}`);
        }
      }
    }

    this.logger.info(`Retrieved service API docs for: ${Object.keys(docs).join(', ')}`);
    return docs;
  };

  async getDocs(): Promise<Record<string, ServiceDoc>> {
    const key = 'docs';
    let docs = this.cache.get<Record<string, ServiceDoc>>(key);
    if (!docs) {
      docs = await this.#retrieveDocs();
      this.cache.set(key, docs);
    }
    return docs;
  }
}

interface ServiceDocProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export const createServiceDocs = ({ logger, directory, tokenProvider }: ServiceDocProps): ServiceDocs => {
  return new ServiceDocsImpl(logger, directory, tokenProvider);
};
