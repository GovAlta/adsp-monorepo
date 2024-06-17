import { User } from '@abgov/adsp-service-sdk';
import { isEqual as isDeepEqual } from 'lodash';
import { Application } from 'express';
import { ConfigurationServiceRoles } from './roles';
import { ConfigurationRouterProps, createConfigurationRouter } from './router';
import { ConfigurationDefinitions } from './types';

export * from './roles';
export * from './types';
export * from './model';
export * from './repository';
export * from './events';

export const applyConfigurationMiddleware = async (
  app: Application,
  { serviceId, configuration, ...props }: ConfigurationRouterProps
): Promise<Application> => {
  // Load a configuration-service configuration that requires configuration with a schema property.
  const schema = {
    type: 'object',
    patternProperties: {
      '^[a-zA-Z0-9-]{1,50}:[a-zA-Z0-9-]{1,50}$': {
        type: 'object',
        properties: {
          description: {
            type: ['string', 'null'],
          },
          anonymousRead: {
            type: 'boolean',
            default: false,
          },
          configurationSchema: {
            $ref: 'http://json-schema.org/draft-07/schema#',
          },
        },
        required: ['configurationSchema'],
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  };

  const entity = await configuration.get<ConfigurationDefinitions>(serviceId.namespace, serviceId.service, null, {
    configurationSchema: schema,
  });

  const serviceConfiguration = {
    description: 'Definitions of configuration with description and schema.',
    configurationSchema: schema,
  };
  if (
    !entity.latest ||
    !isDeepEqual(serviceConfiguration, entity.latest[`${serviceId.namespace}:${serviceId.service}`])
  ) {
    const merged = entity.mergeUpdate({ [`${serviceId.namespace}:${serviceId.service}`]: serviceConfiguration });
    await entity.update({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User, merged);
  }

  const router = createConfigurationRouter({ ...props, serviceId, configuration });
  app.use('/configuration/v2', router);

  return app;
};
