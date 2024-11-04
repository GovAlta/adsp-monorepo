import { adspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  async register({ strapi }: { strapi: Core.Strapi }) {
    await initializePlatform(
      {
        serviceId: adspId`urn:ads:platform:content-service`,
        clientSecret: process.env.CLIENT_SECRET,
        directoryUrl: new URL(process.env.DIRECTORY_URL),
        accessServiceUrl: new URL(process.env.KEYCLOAK_ROOT_URL),
        displayName: 'Content service',
        description: 'Content service provides a headless CMS.',
      },
      { logger: strapi.log }
    );
  },
  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {},
};
