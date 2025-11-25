import require$$0 from 'lodash';
import { __require as requireUtils } from '../utils/index.mjs';

var permissions;
var hasRequiredPermissions;
function requirePermissions() {
    if (hasRequiredPermissions) return permissions;
    hasRequiredPermissions = 1;
    const _ = require$$0;
    const { getService } = requireUtils();
    permissions = {
        async getPermissions (ctx) {
            const permissions = await getService('users-permissions').getActions();
            ctx.send({
                permissions
            });
        },
        async getPolicies (ctx) {
            const policies = _.keys(strapi.plugin('users-permissions').policies);
            ctx.send({
                policies: _.without(policies, 'permissions')
            });
        },
        async getRoutes (ctx) {
            const routes = await getService('users-permissions').getRoutes();
            ctx.send({
                routes
            });
        }
    };
    return permissions;
}

export { requirePermissions as __require };
//# sourceMappingURL=permissions.mjs.map
