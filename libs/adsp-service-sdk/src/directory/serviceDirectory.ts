import axios from 'axios';
import * as NodeCache from 'node-cache';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const retry = require('promise-retry');
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

  #tryRetrieveDirectory = async (requestUrl: URL, count: number): Promise<{ urn: string; serviceUrl: URL }[]> => {
    this.logger.debug(`Try ${count}: retrieve directory entries...`, this.LOG_CONTEXT);

    const token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.get<DirectoryEntry[]>(requestUrl.href, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return data.map(({ urn, url }) => {
      let serviceUrl = null;
      try {
        serviceUrl = new URL(url);
        this.logger.debug(`Cached service directory entry ${urn} -> ${serviceUrl}`, this.LOG_CONTEXT);
      } catch (err) {
        this.logger.error(
          `Error encountered caching entry '${urn}'; entry url may be invalid: ${url}`,
          this.LOG_CONTEXT
        );
      }

      return { urn, serviceUrl };
    });
  };

  #retrieveDirectory = async (): Promise<void> => {
    const url = new URL('/api/discovery/v1', this.directoryUrl);

    try {
      const results = await retry((next, count) => this.#tryRetrieveDirectory(url, count).catch(next));
      results.forEach(({ urn, serviceUrl }) => {
        this.#directoryCache.set(urn, serviceUrl);
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
