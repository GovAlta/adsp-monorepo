'use strict';

var require$$0 = require('lodash');
var index = require('../utils/index.js');

var permissions;
var hasRequiredPermissions;
function requirePermissions() {
    if (hasRequiredPermissions) return permissions;
    hasRequiredPermissions = 1;
    const _ = require$$0;
    const { getService } = index.__require();
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

exports.__require = requirePermissions;
//# sourceMappingURL=permissions.js.map
