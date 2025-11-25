"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adsp_service_sdk_1 = require("@abgov/adsp-service-sdk");
const constants_1 = require("./constants");
const events_1 = require("./events");
const roles_1 = require("./roles");
const strategies_1 = __importDefault(require("./strategies"));
const notifications_1 = require("./notifications");
const register = async ({ strapi }) => {
    var _a;
    const capabilities = await (0, adsp_service_sdk_1.initializePlatform)({
        serviceId: adsp_service_sdk_1.AdspId.parse(strapi.config.get('plugin::adsp-strapi.serviceId')),
        clientSecret: strapi.config.get('plugin::adsp-strapi.clientSecret'),
        directoryUrl: new URL(strapi.config.get('plugin::adsp-strapi.directoryUrl')),
        accessServiceUrl: new URL(strapi.config.get('plugin::adsp-strapi.accessServiceUrl')),
        displayName: strapi.config.get('plugin::adsp-strapi.displayName'),
        description: strapi.config.get('plugin::adsp-strapi.description'),
        roles: [
            { role: roles_1.ServiceRoles.Admin, inTenantAdmin: true, description: 'Administrator role for the content service.' },
            { role: roles_1.ServiceRoles.Reader, description: 'Reader role permitted to access content via the content API.' },
        ],
        events: [events_1.UserRegisteredEventDefinition],
        notifications: [notifications_1.UserRegistrationInvite]
    }, { logger: strapi.log });
    strapi.add(constants_1.ADSP_SERVICE_NAME, capabilities);
    // Register strategy to Content API.
    const { tenantStrategy } = (0, strategies_1.default)(capabilities);
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
        if ((_a = route.config.policies) === null || _a === void 0 ? void 0 : _a.find((policy) => policy.name === 'plugin::content-manager.hasPermissions')) {
            route.config.policies.push('plugin::adsp-strapi.isTenantContentManager');
        }
    }
};
exports.default = register;
//# sourceMappingURL=register.js.map