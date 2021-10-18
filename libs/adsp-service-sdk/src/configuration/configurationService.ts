import axios from 'axios';
import * as NodeCache from 'node-cache';
import type { Logger } from 'winston';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId, assertAdspId } from '../utils';
import type { Configuration, ConfigurationConverter } from './configuration';

export interface ConfigurationService {
  getConfiguration<C, O = void>(serviceId: AdspId, token: string, tenantId: AdspId): Promise<Configuration<C, O>>;
}

export class ConfigurationServiceImpl implements ConfigurationService {
  private readonly LOG_CONTEXT = { context: 'ConfigurationService' };

  #configuration = new NodeCache({
    stdTTL: 900,
    useClones: false,
  });

  #converter: ConfigurationConverter = (value: unknown) => value;

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    converter: ConfigurationConverter = null
  ) {
    if (converter) {
      this.#converter = converter;
    }
  }

  #retrieveConfiguration = async <C>(serviceId: AdspId, token: string, tenantId?: AdspId): Promise<C> => {
    const service = serviceId.service;

    this.logger.debug(`Retrieving tenant '${tenantId?.toString() || 'core'}' configuration for ${service}...'`, {
      ...this.LOG_CONTEXT,
      tenant: tenantId?.toString(),
    });

    const configurationServiceUrl = await this.directory.getServiceUrl(
      adspId`urn:ads:platform:configuration-service:v2`
    );

    const configUrl = new URL(
      `v2/configuration/${serviceId.namespace}/${service}/latest${tenantId ? `?tenantId=${tenantId}` : ''}`,
      configurationServiceUrl
    );

    this.logger.debug(`Retrieving configuration from ${configUrl}...'`, {
      ...this.LOG_CONTEXT,
      tenant: tenantId?.toString(),
    });

    try {
      const { data } = await axios.get<C>(configUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const config = (data ? this.#converter(data, tenantId) : null) as C;
      if (config) {
        this.#configuration.set(`${tenantId ? tenantId.toString() + '-' : ''}${serviceId}`, config);
        this.logger.info(`Retrieved and cached '${tenantId?.toString() || 'core'}' configuration for ${service}.`, {
          ...this.LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      } else {
        this.logger.info(`Retrieved configuration for ${service} and received no value.`, {
          ...this.LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      }

      return config;
    } catch (err) {
      this.logger.warn(`Error encountered in request for configuration of ${service}. ${err}`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
      return null as C;
    }
  };

  getConfiguration = async <C, O = void>(
    serviceId: AdspId,
    token: string,
    tenantId?: AdspId
  ): Promise<Configuration<C, O>> => {
    let configuration = {};
    if (tenantId) {
      assertAdspId(tenantId, 'Provided ID is not for a tenant', 'resource');

      configuration =
        this.#configuration.get<C>(`${tenantId}-${serviceId}`) ||
        (await this.#retrieveConfiguration<C>(serviceId, token, tenantId)) ||
        null;
    }

    const options =
      this.#configuration.get<O>(`${serviceId}`) || (await this.#retrieveConfiguration<O>(serviceId, token)) || null;

    return [configuration, options] as Configuration<C, O>;
  };
}
