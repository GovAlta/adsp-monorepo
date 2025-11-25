'use strict';

var deleteRole;
var hasRequiredDeleteRole;
function requireDeleteRole() {
    if (hasRequiredDeleteRole) return deleteRole;
    hasRequiredDeleteRole = 1;
    deleteRole = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        return {
            type: 'UsersPermissionsDeleteRolePayload',
            args: {
                id: nonNull('ID')
            },
            description: 'Delete an existing role',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.params = {
                    role: args.id
                };
                await strapi.plugin('users-permissions').controller('role').deleteRole(koaContext);
                return {
                    ok: true
                };
            }
        };
    };
    return deleteRole;
}

exports.__require = requireDeleteRole;
//# sourceMappingURL=delete-role.js.map
