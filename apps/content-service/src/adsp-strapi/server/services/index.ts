import { Core } from '@strapi/strapi';
import { ADSP_SERVICE_NAME, PlatformCapabilities } from '../constants';

export default {
  directory: async ({ strapi }: { strapi: Core.Strapi }) => {
    return strapi.get<PlatformCapabilities>(ADSP_SERVICE_NAME).directory;
  },
  tokenProvider: async ({ strapi }: { strapi: Core.Strapi }) => {
    return strapi.get<PlatformCapabilities>(ADSP_SERVICE_NAME).tokenProvider;
  },
  tenantService: async ({ strapi }: { strapi: Core.Strapi }) => {
    return strapi.get<PlatformCapabilities>(ADSP_SERVICE_NAME).tenantService;
  },
  configurationService: async ({ strapi }: { strapi: Core.Strapi }) => {
    return strapi.get<PlatformCapabilities>(ADSP_SERVICE_NAME).configurationService;
  },
  eventService: async ({ strapi }: { strapi: Core.Strapi }) => {
    return strapi.get<PlatformCapabilities>(ADSP_SERVICE_NAME).eventService;
  },
};
