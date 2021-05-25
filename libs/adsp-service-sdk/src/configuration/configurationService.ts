import axios from 'axios';
import * as NodeCache from 'node-cache';
import type { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId, assertAdspId } from '../utils';

export interface ConfigurationService {
  getConfiguration<C>(tenant: AdspId): Promise<C>;
}

export class ConfigurationServiceImpl implements ConfigurationService {
  private readonly LOG_CONTEXT = { context: 'ConfigurationService' };

  #configuration = new NodeCache({
    stdTTL: 3600,
    useClones: false,
  });

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider
  ) {}

  #retrieveConfiguration = async <C>(tenant: AdspId): Promise<C> => {
    this.logger.debug(`Retrieving tenant '${tenant}' configuration...'`, this.LOG_CONTEXT);
    const configurationServiceUrl = await this.directory.getServiceUrl(
      adspId`urn:ads:platform:configuration-service:v1`
    );

    const configUrl = new URL(`/tenantConfig/list`, configurationServiceUrl);
    this.logger.debug(`Retrieving tenant configuration from ${configUrl}...'`, this.LOG_CONTEXT);

    const token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.get<C>(configUrl.href, { headers: { Authorization: `Bearer ${token}` } });

    this.#configuration.set(`${tenant}`, data);
    this.logger.info(`Retrieved and cached tenant '${tenant}' configuration.`, this.LOG_CONTEXT);

    return data;
  };

  getConfiguration = async <C>(tenantId: AdspId): Promise<C> => {
    assertAdspId(tenantId, 'Provided ID is not for a tenant', 'resource');

    const configuration = this.#configuration.get<C>(`${tenantId}`) || (await this.#retrieveConfiguration<C>(tenantId));
    return configuration;
  };
}
