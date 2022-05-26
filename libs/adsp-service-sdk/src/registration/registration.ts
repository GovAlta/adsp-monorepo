import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const retry = require('promise-retry');
import { Logger } from 'winston';
import { ServiceRegistrar, ServiceRegistration, ServiceRole } from './index';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { AdspId, adspId } from '../utils';

export class ServiceRegistrarImpl implements ServiceRegistrar {
  private readonly LOG_CONTEXT = { context: 'ServiceRegistration' };

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider
  ) {}

  async register(registration: ServiceRegistration): Promise<void> {
    if (registration.configurationSchema) {
      const namespace = registration.serviceId.namespace;
      const name = registration.serviceId.service;
      const update = {
        [`${namespace}:${name}`]: {
          configurationSchema: registration.configurationSchema,
        },
      };
      await this.updateConfiguration(adspId`urn:ads:platform:configuration-service`, update);
    }

    if (registration.roles) {
      const update = {
        [registration.serviceId.toString()]: {
          roles: registration.roles.map((r) => ((r as ServiceRole).role ? r : { role: r, description: '' })) || [],
        },
      };
      await this.updateConfiguration(adspId`urn:ads:platform:tenant-service`, update);
    }

    if (registration.events) {
      const namespace = registration.serviceId.service;
      const update = {
        [namespace]: {
          name: namespace,
          definitions: registration.events.reduce(
            (defs, def) => ({
              ...defs,
              [def.name]: {
                name: def.name,
                description: def.description,
                payloadSchema: def.payloadSchema,
                interval: def.interval,
                log: def.log
              },
            }),
            {}
          ),
        },
      };
      await this.updateConfiguration(adspId`urn:ads:platform:event-service`, update);
    }

    if (registration.eventStreams) {
      const update = registration.eventStreams.reduce(
        (streams, stream) => ({
          ...streams,
          [stream.id]: {
            id: stream.id,
            name: stream.name,
            description: stream.description,
            events: stream.events,
            subscriberRoles: stream.subscriberRoles,
            publicSubscribe: stream.publicSubscribe,
          },
        }),
        {}
      );
      await this.updateConfiguration(adspId`urn:ads:platform:push-service`, update);
    }

    if (registration.fileTypes) {
      const update = registration.fileTypes.reduce(
        (types, type) => ({
          ...types,
          [type.id]: {
            id: type.id,
            name: type.name,
            anonymousRead: type.anonymousRead,
            readRoles: type.readRoles,
            updateRoles: type.updateRoles,
          },
        }),
        {}
      );
      await this.updateConfiguration(adspId`urn:ads:platform:file-service`, update);
    }

    if (registration.notifications) {
      const update = registration.notifications.reduce(
        (types, type) => ({
          ...types,
          [type.name]: {
            ...type,
            id: type.name,
            name: type.displayName || type.name,
            events: type.events,
          },
        }),
        {}
      );

      await this.updateConfiguration(adspId`urn:ads:platform:notification-service`, update);
    }

    if (registration.values) {
      const namespace = registration.serviceId.service;
      const update = {
        [namespace]: {
          name: namespace,
          definitions: registration.values.reduce(
            (defs, def) => ({
              ...defs,
              [def.id]: {
                name: def.id,
                displayName: def.name,
                description: def.description,
                jsonSchema: def.jsonSchema,
              },
            }),
            {}
          ),
        },
      };
      await this.updateConfiguration(adspId`urn:ads:platform:value-service`, update);
    }

    if (registration.serviceConfigurations) {
      for (const { serviceId, configuration } of registration.serviceConfigurations) {
        await this.updateConfiguration(serviceId, configuration);
      }
    }
  }

  private async updateConfiguration<C extends Record<string, unknown>>(serviceId: AdspId, update: C): Promise<void> {
    const configurationServiceId = adspId`urn:ads:platform:configuration-service:v2`;
    const serviceUrl = await this.directory.getServiceUrl(configurationServiceId);

    try {
      await retry(async (next, count) => {
        try {
          await this.#tryUpdateConfiguration(serviceUrl, count, serviceId, update);
        } catch (err) {
          this.logger.debug(`Try ${count} failed with error. ${err}`, this.LOG_CONTEXT);
          next(err);
        }
      });

      this.logger.info(`Updated registration configuration of ${serviceId}.`, this.LOG_CONTEXT);
    } catch (err) {
      this.logger.error(`Error encountered registering configuration. ${err}`);
      throw err;
    }
  }

  #tryUpdateConfiguration = async (
    configurationServiceUrl: URL,
    count: number,
    serviceId: AdspId,
    update: Record<string, unknown>
  ): Promise<void> => {
    this.logger.debug(`Try ${count}: updating configuration for service ${serviceId}...`, this.LOG_CONTEXT);

    const configurationUrl = new URL(
      `v2/configuration/${serviceId.namespace}/${serviceId.service}`,
      configurationServiceUrl
    );

    const token = await this.tokenProvider.getAccessToken();
    await axios.patch(
      configurationUrl.href,
      {
        operation: 'UPDATE',
        update,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };
}
