'use strict';

var utils = require('../../../utils.js');

var deleteUser;
var hasRequiredDeleteUser;
function requireDeleteUser() {
    if (hasRequiredDeleteUser) return deleteUser;
    hasRequiredDeleteUser = 1;
    const { checkBadRequest } = utils.__require();
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

exports.__require = requireDeleteUser;
//# sourceMappingURL=delete-user.js.map
