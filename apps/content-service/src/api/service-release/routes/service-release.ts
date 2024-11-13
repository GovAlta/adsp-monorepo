/**
 * service-release router
 */

import { factories } from '@strapi/strapi';

const model = 'api::service-release.service-release';
export default factories.createCoreRouter(model, {
  config: {
    find: { policies: [{ name: 'plugin::adsp-strapi.isTenantUserWithRole', config: { model } }] },
    findOne: { policies: [{ name: 'plugin::adsp-strapi.isTenantUserWithRole', config: { model } }] },
    create: { policies: [{ name: 'plugin::adsp-strapi.isTenantUserWithRole', config: { model } }] },
    update: { policies: [{ name: 'plugin::adsp-strapi.isTenantUserWithRole', config: { model } }] },
    delete: { policies: [{ name: 'plugin::adsp-strapi.isTenantUserWithRole', config: { model } }] },
  },
});
