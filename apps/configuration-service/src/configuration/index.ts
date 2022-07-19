import { User } from '@abgov/adsp-service-sdk';
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
    additionalProperties: {
      type: 'object',
      properties: {
        description: {
          type: ['string', 'null'],
        },
        configurationSchema: {
          type: 'object',
        },
      },
      required: ['configurationSchema'],
      additionalProperties: false,
    },
  };

  const entity = await configuration.get<ConfigurationDefinitions>(
    serviceId.namespace,
    serviceId.service,
    null,
    schema
  );

  if (!entity.latest) {
    await entity.update({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User, {
      [`${serviceId.namespace}:${serviceId.service}`]: { configurationSchema: schema },
    });
  }

  const router = createConfigurationRouter({ ...props, serviceId, configuration });
  app.use('/configuration/v2', router);

  return app;
};
