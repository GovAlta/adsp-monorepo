import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { Core } from '@strapi/strapi';
import { ADSP_SERVICE_NAME } from './constants';
// import adaptTenantStrategy from './strategies';

const register = async ({ strapi }: { strapi: Core.Strapi }) => {
  const capabilities = await initializePlatform(
    {
      serviceId: AdspId.parse(strapi.config.get('plugin::adsp-strapi.serviceId')),
      clientSecret: strapi.config.get('plugin::adsp-strapi.clientSecret'),
      directoryUrl: new URL(strapi.config.get('plugin::adsp-strapi.directoryUrl')),
      accessServiceUrl: new URL(strapi.config.get('plugin::adsp-strapi.accessServiceUrl')),
      displayName: strapi.config.get('plugin::adsp-strapi.displayName'),
      description: strapi.config.get('plugin::adsp-strapi.description'),
    },
    { logger: strapi.log },
  );
  strapi.add(ADSP_SERVICE_NAME, capabilities);

  // const tenantStrategy = adaptTenantStrategy(capabilities);
  // strapi.get('auth').register('content-api', tenantStrategy);
};

export default register;
