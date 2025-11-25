import { __require as requireValidation } from './validation.mjs';

var permissions;
var hasRequiredPermissions;
function requirePermissions() {
    if (hasRequiredPermissions) return permissions;
    hasRequiredPermissions = 1;
    const { UsersPermissionsRouteValidator } = requireValidation();
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

export { requirePermissions as __require };
//# sourceMappingURL=permissions.mjs.map
