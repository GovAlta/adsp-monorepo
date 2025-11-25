"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
exports.default = {
    directory: async ({ strapi }) => {
        return strapi.get(constants_1.ADSP_SERVICE_NAME).directory;
    },
    tokenProvider: async ({ strapi }) => {
        return strapi.get(constants_1.ADSP_SERVICE_NAME).tokenProvider;
    },
    tenantService: async ({ strapi }) => {
        return strapi.get(constants_1.ADSP_SERVICE_NAME).tenantService;
    },
    configurationService: async ({ strapi }) => {
        return strapi.get(constants_1.ADSP_SERVICE_NAME).configurationService;
    },
    eventService: async ({ strapi }) => {
        return strapi.get(constants_1.ADSP_SERVICE_NAME).eventService;
    },
};
//# sourceMappingURL=index.js.map