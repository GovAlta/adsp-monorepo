import { __require as requireUtils } from '../../../utils.mjs';

var deleteUser;
var hasRequiredDeleteUser;
function requireDeleteUser() {
    if (hasRequiredDeleteUser) return deleteUser;
    hasRequiredDeleteUser = 1;
    const { checkBadRequest } = requireUtils();
    const usersPermissionsUserUID = 'plugin::users-permissions.user';
    deleteUser = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        const { getEntityResponseName } = strapi.plugin('graphql').service('utils').naming;
        const userContentType = strapi.getModel(usersPermissionsUserUID);
        const responseName = getEntityResponseName(userContentType);
        return {
            type: nonNull(responseName),
            args: {
                id: nonNull('ID')
            },
            description: 'Delete an existing user',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.params = {
                    id: args.id
                };
                await strapi.plugin('users-permissions').controller('user').destroy(koaContext);
                checkBadRequest(koaContext.body);
                return {
                    value: koaContext.body,
                    info: {
                        args,
                        resourceUID: 'plugin::users-permissions.user'
                    }
                };
            }
        };
    };
    return deleteUser;
}

export { requireDeleteUser as __require };
//# sourceMappingURL=delete-user.mjs.map
