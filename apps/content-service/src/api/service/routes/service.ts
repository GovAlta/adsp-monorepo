/**
 * service router
 */

import { factories } from '@strapi/strapi';
import { ServiceRoles } from '../../../adsp-strapi/server/roles';

const model = 'api::service.service';
export default factories.createCoreRouter(model, {
  config: {
    find: {
      policies: [
        {
          name: 'plugin::adsp-strapi.isTenantUserWithRole',
          config: { model },
        },
      ],
    },
    findOne: {
      policies: [
        {
          name: 'plugin::adsp-strapi.isTenantUserWithRole',
          config: { model },
        },
      ],
    },
    create: {
      policies: [
        {
          name: 'plugin::adsp-strapi.isTenantUserWithRole',
          config: { model, roles: [ServiceRoles.Admin] },
        },
      ],
    },
    update: {
      policies: [
        {
          name: 'plugin::adsp-strapi.isTenantUserWithRole',
          config: { model, roles: [ServiceRoles.Admin] },
        },
      ],
    },
    delete: {
      policies: [
        {
          name: 'plugin::adsp-strapi.isTenantUserWithRole',
          config: { model, roles: [ServiceRoles.Admin] },
        },
      ],
    },
  },
});
