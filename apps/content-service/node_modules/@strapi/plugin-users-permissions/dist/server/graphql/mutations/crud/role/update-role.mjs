var updateRole;
var hasRequiredUpdateRole;
function requireUpdateRole() {
    if (hasRequiredUpdateRole) return updateRole;
    hasRequiredUpdateRole = 1;
    const usersPermissionsRoleUID = 'plugin::users-permissions.role';
    updateRole = ({ nexus, strapi })=>{
        const { getContentTypeInputName } = strapi.plugin('graphql').service('utils').naming;
        const { nonNull } = nexus;
        const roleContentType = strapi.getModel(usersPermissionsRoleUID);
        const roleInputName = getContentTypeInputName(roleContentType);
        return {
            type: 'UsersPermissionsUpdateRolePayload',
            args: {
                id: nonNull('ID'),
                data: nonNull(roleInputName)
            },
            description: 'Update an existing role',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.params = {
                    role: args.id
                };
                koaContext.request.body = args.data;
                koaContext.request.body.role = args.id;
                await strapi.plugin('users-permissions').controller('role').updateRole(koaContext);
                return {
                    ok: true
                };
            }
        };
    };
    return updateRole;
}

export { requireUpdateRole as __require };
//# sourceMappingURL=update-role.mjs.map
