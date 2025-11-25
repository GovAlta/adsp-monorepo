"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_admin_user_1 = __importDefault(require("./is-admin-user"));
const is_tenant_content_manager_1 = __importDefault(require("./is-tenant-content-manager"));
const is_tenant_user_with_role_1 = __importDefault(require("./is-tenant-user-with-role"));
exports.default = {
    isAdminUser: is_admin_user_1.default,
    isTenantUserWithRole: is_tenant_user_with_role_1.default,
    isTenantContentManager: is_tenant_content_manager_1.default,
};
//# sourceMappingURL=index.js.map