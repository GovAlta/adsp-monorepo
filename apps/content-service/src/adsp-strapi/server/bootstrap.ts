import { adspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { Core } from '@strapi/strapi';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  // bootstrap phase

  await initializePlatform(
    {
      serviceId: adspId`urn:ads:platform:content-service`,
      clientSecret: process.env.CLIENT_SECRET,
      directoryUrl: new URL(process.env.DIRECTORY_URL),
      accessServiceUrl: new URL(process.env.KEYCLOAK_ROOT_URL),
      displayName: 'Content service',
      description: ''
    },
    { logger: strapi.log }
  );
};

export default bootstrap;
