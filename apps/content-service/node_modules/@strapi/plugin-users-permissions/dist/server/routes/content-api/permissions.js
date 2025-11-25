'use strict';

var validation = require('./validation.js');

var permissions;
var hasRequiredPermissions;
function requirePermissions() {
    if (hasRequiredPermissions) return permissions;
    hasRequiredPermissions = 1;
    const { UsersPermissionsRouteValidator } = validation.__require();
    permissions = (strapi)=>{
        const validator = new UsersPermissionsRouteValidator(strapi);
        return [
            {
                method: 'GET',
                path: '/permissions',
                handler: 'permissions.getPermissions',
                response: validator.permissionsResponseSchema
            }
        ];
    };
    return permissions;
}

exports.__require = requirePermissions;
//# sourceMappingURL=permissions.js.map
