'use strict';

var require$$0 = require('lodash/fp');

var createRole;
var hasRequiredCreateRole;
function requireCreateRole() {
    if (hasRequiredCreateRole) return createRole;
    hasRequiredCreateRole = 1;
    const { toPlainObject } = require$$0;
    const usersPermissionsRoleUID = 'plugin::users-permissions.role';
    createRole = ({ nexus, strapi })=>{
        const { getContentTypeInputName } = strapi.plugin('graphql').service('utils').naming;
        const { nonNull } = nexus;
        const roleContentType = strapi.getModel(usersPermissionsRoleUID);
        const roleInputName = getContentTypeInputName(roleContentType);
        return {
            type: 'UsersPermissionsCreateRolePayload',
            args: {
                data: nonNull(roleInputName)
            },
            description: 'Create a new role',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.request.body = toPlainObject(args.data);
                await strapi.plugin('users-permissions').controller('role').createRole(koaContext);
                return {
                    ok: true
                };
            }
        };
    };
    return createRole;
}

exports.__require = requireCreateRole;
//# sourceMappingURL=create-role.js.map
