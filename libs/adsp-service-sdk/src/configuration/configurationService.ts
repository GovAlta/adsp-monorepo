import axios from 'axios';
import * as camelcase from 'camelcase';
import * as NodeCache from 'node-cache';
import type { Logger } from 'winston';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId, assertAdspId } from '../utils';

export interface ConfigurationService {
  getConfiguration<C>(tenant: AdspId, token: string): Promise<C>;
}

export class ConfigurationServiceImpl implements ConfigurationService {
  private readonly LOG_CONTEXT = { context: 'ConfigurationService' };

  #configuration = new NodeCache({
    stdTTL: 900,
    useClones: false,
  });

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly serviceId: AdspId
  ) {}

  #retrieveConfiguration = async <C>(tenant: AdspId, token: string): Promise<C> => {
    this.logger.debug(`Retrieving tenant '${tenant}' configuration...'`, this.LOG_CONTEXT);
    const configurationServiceUrl = await this.directory.getServiceUrl(
      adspId`urn:ads:platform:configuration-service:v1`
    );

    // TODO: camelcase is used since we're inconsistent about how the service configuration is keyed.
    const configUrl = new URL(`v1/tenantConfig/${camelcase(this.serviceId.service)}`, configurationServiceUrl);
    this.logger.debug(`Retrieving tenant configuration from ${configUrl}...'`, this.LOG_CONTEXT);

    const { data } = await axios.get<C>(configUrl.href, { headers: { Authorization: `Bearer ${token}` } });

    this.#configuration.set(`${tenant}`, data);
    this.logger.info(`Retrieved and cached tenant '${tenant}' configuration.`, this.LOG_CONTEXT);

    return data;
  };

  getConfiguration = async <C>(tenantId: AdspId, token: string): Promise<C> => {
    assertAdspId(tenantId, 'Provided ID is not for a tenant', 'resource');

    const configuration =
      this.#configuration.get<C>(`${tenantId}`) || (await this.#retrieveConfiguration<C>(tenantId, token));
    return configuration;
  };
}
