"use strict";
/**
 * service router
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const roles_1 = require("../../../adsp-strapi/server/roles");
const model = 'api::service.service';
exports.default = strapi_1.factories.createCoreRouter(model, {
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
                    config: { model, roles: [roles_1.ServiceRoles.Admin] },
                },
            ],
        },
        update: {
            policies: [
                {
                    name: 'plugin::adsp-strapi.isTenantUserWithRole',
                    config: { model, roles: [roles_1.ServiceRoles.Admin] },
                },
            ],
        },
        delete: {
            policies: [
                {
                    name: 'plugin::adsp-strapi.isTenantUserWithRole',
                    config: { model, roles: [roles_1.ServiceRoles.Admin] },
                },
            ],
        },
    },
});
//# sourceMappingURL=service.js.map