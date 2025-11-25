"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adsp_service_sdk_1 = require("@abgov/adsp-service-sdk");
const roles_1 = require("../roles");
const apply_request_tenant_1 = require("./apply-request-tenant");
/**
 * Policy that enforces user tenant context on content API requests.
 *
 * @param {Core.PolicyContext} policyContext
 * @param {*} config
 * @param {{ strapi: Core.Strapi }} { strapi }
 * @returns
 */
const isTenantUserWithRole = async (policyContext, config, { strapi }) => {
    var _a, _b;
    const { roles = [roles_1.ServiceRoles.Reader], model } = config;
    const { id: documentId } = policyContext['params'];
    if (!model) {
        return false;
    }
    try {
        const request = policyContext.request;
        const user = (_b = (_a = policyContext['state']) === null || _a === void 0 ? void 0 : _a.auth) === null || _b === void 0 ? void 0 : _b.credentials;
        const tenantId = user === null || user === void 0 ? void 0 : user.tenantId;
        const requestedTenantId = await (0, apply_request_tenant_1.applyRequestTenant)(strapi, request, tenantId, model, documentId, () => {
            request.body.data.tenantId = tenantId === null || tenantId === void 0 ? void 0 : tenantId.toString();
        });
        return (0, adsp_service_sdk_1.isAllowedUser)(user, requestedTenantId ? adsp_service_sdk_1.AdspId.parse(requestedTenantId) : null, [
            roles_1.ServiceRoles.Admin,
            ...roles,
        ]);
    }
    catch (err) {
        return false;
    }
};
exports.default = isTenantUserWithRole;
//# sourceMappingURL=is-tenant-user-with-role.js.map