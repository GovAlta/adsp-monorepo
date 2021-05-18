import axios from 'axios';
import * as NodeCache from 'node-cache';
import type { Logger } from 'winston';
import { TokenProvider } from '../access';
import { AdspId, assertAdspId } from '../utils';

interface DirectoryEntry {
  urn: string;
  url: string;
}

export interface ServiceDirectory {
  getServiceUrl(id: AdspId): Promise<URL>;
}

export class ServiceDirectoryImpl implements ServiceDirectory {
  private readonly LOG_CONTEXT = { context: 'ServiceDirectory' };

  #directoryCache = new NodeCache({
    stdTTL: 36000,
    useClones: false,
  });

  constructor(
    private readonly logger: Logger,
    private readonly directoryUrl: URL,
    private readonly tokenProvider: TokenProvider
  ) {}

  #retrieveDirectory = async (): Promise<void> => {
    const url = new URL('/api/discovery/v1', this.directoryUrl);
    this.logger.debug(`Retrieving service directory from ${url}...`, this.LOG_CONTEXT);

    try {
      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.get<DirectoryEntry[]>(url.href, { headers: { Authorization: `Bearer ${token}` } });

      data.forEach(({ urn, url }) => {
        try {
          const serviceUrl = new URL(url);
          this.#directoryCache.set(urn, serviceUrl);
          this.logger.debug(`Cached service directory entry ${urn} -> ${serviceUrl}`, this.LOG_CONTEXT);
        } catch (err) {
          this.logger.error(
            `Error encountered caching entry '${urn}'; entry url may be invalid: ${url}`,
            this.LOG_CONTEXT
          );
        }
      });

      this.logger.info(`Retrieved service directory from ${url}.`, this.LOG_CONTEXT);
    } catch (err) {
      this.logger.error(`Error encountered retrieving directory. ${err}`, this.LOG_CONTEXT);
    }
  };

  async getServiceUrl(id: AdspId): Promise<URL> {
    assertAdspId(id, 'Provided ID is not for a Service or API.', 'api', 'service');

    const key = `${id}`;
    let value = this.#directoryCache.get<URL>(key);
    if (!value) {
      await this.#retrieveDirectory();
      value = this.#directoryCache.get<URL>(key);
      if (!value) {
        throw new Error(`Failed to find directory entry for ${key}`);
      }
    }

    return value;
  }
}
