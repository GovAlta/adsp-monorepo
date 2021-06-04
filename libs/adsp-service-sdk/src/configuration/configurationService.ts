import axios from 'axios';
import * as camelcase from 'camelcase';
import * as NodeCache from 'node-cache';
import type { Logger } from 'winston';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId, assertAdspId } from '../utils';
import type { Configuration, ConfigurationConverter } from './configuration';

export interface ConfigurationService {
  getConfiguration<C, O = undefined>(serviceId: AdspId, token: string, tenantId: AdspId): Promise<C & { options: O }>;
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

  #retrieveConfiguration = async <C>(tenantId: AdspId, serviceId: AdspId, token: string): Promise<C> => {
    this.logger.debug(`Retrieving tenant '${tenantId}' configuration...'`, this.LOG_CONTEXT);

    const configurationServiceUrl = await this.directory.getServiceUrl(
      adspId`urn:ads:platform:configuration-service:v1`
    );
    const service = camelcase(serviceId.service);

    const configUrl = new URL(`v1/tenantConfig/${service}`, configurationServiceUrl);
    this.logger.debug(`Retrieving tenant configuration from ${configUrl}...'`, this.LOG_CONTEXT);

    try {
      const { data } = await axios.get<C>(configUrl.href, { headers: { Authorization: `Bearer ${token}` } });

      const config = this.#converter(data, tenantId) as C;
      if (config) {
        this.#configuration.set(`${tenantId}-${serviceId}`, config);
        this.logger.info(`Retrieved and cached tenant '${tenantId}' configuration for ${service}.`, this.LOG_CONTEXT);
      } else {
        this.logger.info(
          `Retrieved tenant '${tenantId}' configuration for ${service} and received no value.`,
          this.LOG_CONTEXT
        );
      }

      return config;
    } catch (err) {
      this.logger.warn(`Error encountered in request for tenant '${tenantId}' configuration for ${service}. ${err}`);
      return null;
    }
  };

  #retrieveOptions = async <O>(serviceId: AdspId, token: string): Promise<O> => {
    this.logger.debug(`Retrieving service '${serviceId}' options...'`, this.LOG_CONTEXT);

    const configurationServiceUrl = await this.directory.getServiceUrl(
      adspId`urn:ads:platform:configuration-service:v1`
    );
    const service = camelcase(serviceId.service);

    const optionsUrl = new URL(`v1/serviceOptions?service=${service}&top=1`, configurationServiceUrl);
    this.logger.debug(`Retrieving service options from ${optionsUrl}...'`, this.LOG_CONTEXT);

    try {
      const { data } = await axios.get<{ results: { configOptions: O }[] }>(optionsUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const options = this.#converter(data.results[0]?.configOptions) as O;
      if (options) {
        this.#configuration.set(`${serviceId}`, options);
        this.logger.info(`Retrieved and cached service '${service}' options.`, this.LOG_CONTEXT);
      } else {
        this.logger.info(`Retrieved and service '${service}' options and received no value.`, this.LOG_CONTEXT);
      }

      return options;
    } catch (err) {
      this.logger.warn(`Error encountered in request for service '${service}' options. ${err}`);
      return null;
    }
  };

  getConfiguration = async <C, O = undefined>(
    serviceId: AdspId,
    token: string,
    tenantId?: AdspId
  ): Promise<Configuration<C, O>> => {
    let configuration = {};
    if (tenantId) {
      assertAdspId(tenantId, 'Provided ID is not for a tenant', 'resource');

      configuration =
        this.#configuration.get<C>(`${tenantId}-${serviceId}`) ||
        (await this.#retrieveConfiguration<C>(tenantId, serviceId, token)) ||
        {};
    }

    const options = this.#configuration.get<O>(`${serviceId}`) || (await this.#retrieveOptions<O>(serviceId, token));

    return { ...configuration, options } as Configuration<C, O>;
  };
}
