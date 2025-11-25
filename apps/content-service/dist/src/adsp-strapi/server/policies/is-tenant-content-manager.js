"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apply_request_tenant_1 = require("./apply-request-tenant");
/**
 * Policy that enforces user tenant context on content manager requests for authoring and publishing content.
 *
 * @param {*} policyContext
 * @param {*} config
 * @param {{ strapi: Core.Strapi }} { strapi }
 * @returns
 */
const isTenantContentManager = async (policyContext, _config, { strapi }) => {
    var _a, _b, _c;
    const { model, id: documentId } = policyContext['params'];
    try {
        // This is the user object based on the built-in admin strategy.
        const user = (_b = (_a = policyContext['state']) === null || _a === void 0 ? void 0 : _a.auth) === null || _b === void 0 ? void 0 : _b.credentials;
        const request = policyContext.request;
        const tenantId = (_c = user === null || user === void 0 ? void 0 : user.tenantId) === null || _c === void 0 ? void 0 : _c.toString();
        const requestedTenantId = await (0, apply_request_tenant_1.applyRequestTenant)(strapi, request, tenantId, model, documentId, () => {
            request.body.tenantId = tenantId;
        });
        // Pass if user isn't in a tenant context, or
        // requested document isn't in a tenant context, or
        // tenant contexts are the same.
        return !tenantId || !requestedTenantId || tenantId === requestedTenantId;
    }
    catch (err) {
        return false;
    }
};
exports.default = isTenantContentManager;
//# sourceMappingURL=is-tenant-content-manager.js.map