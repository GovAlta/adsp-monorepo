"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adsp_service_sdk_1 = require("@abgov/adsp-service-sdk");
const roles_1 = require("../roles");
const isAdminUser = (policyContext, _config, { strapi: _strapi }) => {
    var _a, _b;
    const user = (_b = (_a = policyContext['state']) === null || _a === void 0 ? void 0 : _a.auth) === null || _b === void 0 ? void 0 : _b.credentials;
    return (0, adsp_service_sdk_1.isAllowedUser)(user, null, roles_1.ServiceRoles.Admin);
};
exports.default = isAdminUser;
//# sourceMappingURL=is-admin-user.js.map