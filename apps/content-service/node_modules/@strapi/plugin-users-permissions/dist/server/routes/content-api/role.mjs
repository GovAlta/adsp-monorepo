import { __require as requireValidation } from './validation.mjs';

var role;
var hasRequiredRole;
function requireRole() {
    if (hasRequiredRole) return role;
    hasRequiredRole = 1;
    const { UsersPermissionsRouteValidator } = requireValidation();
    role = (strapi)=>{
        const validator = new UsersPermissionsRouteValidator(strapi);
        return [
            {
                method: 'GET',
                path: '/roles/:id',
                handler: 'role.findOne',
                request: {
                    params: {
                        id: validator.roleIdParam
                    }
                },
                response: validator.roleResponseSchema
            },
            {
                method: 'GET',
                path: '/roles',
                handler: 'role.find',
                response: validator.rolesResponseSchema
            },
            {
                method: 'POST',
                path: '/roles',
                handler: 'role.createRole',
                request: {
                    body: {
                        'application/json': validator.createRoleBodySchema
                    }
                },
                response: validator.roleSuccessResponseSchema
            },
            {
                method: 'PUT',
                path: '/roles/:role',
                handler: 'role.updateRole',
                request: {
                    params: {
                        role: validator.roleIdParam
                    },
                    body: {
                        'application/json': validator.updateRoleBodySchema
                    }
                },
                response: validator.roleSuccessResponseSchema
            },
            {
                method: 'DELETE',
                path: '/roles/:role',
                handler: 'role.deleteRole',
                request: {
                    params: {
                        role: validator.roleIdParam
                    }
                },
                response: validator.roleSuccessResponseSchema
            }
        ];
    };
    return role;
}

export { requireRole as __require };
//# sourceMappingURL=role.mjs.map
