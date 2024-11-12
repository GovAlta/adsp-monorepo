import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { Core } from '@strapi/strapi';
import { ADSP_SERVICE_NAME } from './constants';
import { UserRegisteredEventDefinition } from './events';
import { ServiceRoles } from './roles';
import getStrategies from './strategies';

const register = async ({ strapi }: { strapi: Core.Strapi }) => {
  const capabilities = await initializePlatform(
    {
      serviceId: AdspId.parse(strapi.config.get('plugin::adsp-strapi.serviceId')),
      clientSecret: strapi.config.get('plugin::adsp-strapi.clientSecret'),
      directoryUrl: new URL(strapi.config.get('plugin::adsp-strapi.directoryUrl')),
      accessServiceUrl: new URL(strapi.config.get('plugin::adsp-strapi.accessServiceUrl')),
      displayName: strapi.config.get('plugin::adsp-strapi.displayName'),
      description: strapi.config.get('plugin::adsp-strapi.description'),
      roles: [
        { role: ServiceRoles.Admin, inTenantAdmin: true, description: 'Administrator role for the content service.' },
        { role: ServiceRoles.Author, description: 'Author role permitted to create content.' },
        { role: ServiceRoles.Editor, description: 'Editor role permitted to edit and publish content.' },
      ],
      events: [UserRegisteredEventDefinition],
    },
    { logger: strapi.log },
  );
  strapi.add(ADSP_SERVICE_NAME, capabilities);

  // Register strategy to Content API.
  const { tenantStrategy } = getStrategies(capabilities);
  strapi.get('auth').register('content-api', tenantStrategy);
  strapi.get('auth').register('admin', tenantStrategy);

  // Add tenantId to the admin user model.
  strapi.contentTypes['admin::user'].attributes['tenantId'] = {
    type: 'string',
    private: true,
    configurable: false,
  };

  // Add the tenant context policy to content-manager routes which check permissions.
  for (const route of strapi.plugins['content-manager'].routes['admin'].routes) {
    if (route.config.policies?.find((policy) => policy.name === 'plugin::content-manager.hasPermissions')) {
      route.config.policies.push('plugin::adsp-strapi.applyTenantContext');
    }
  }
};

export default register;
