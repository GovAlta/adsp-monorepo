'use strict';

var require$$0 = require('lodash/fp');
var utils = require('../../../utils.js');

var updateUser;
var hasRequiredUpdateUser;
function requireUpdateUser() {
    if (hasRequiredUpdateUser) return updateUser;
    hasRequiredUpdateUser = 1;
    const { toPlainObject } = require$$0;
    const { checkBadRequest } = utils.__require();
    const usersPermissionsUserUID = 'plugin::users-permissions.user';
    updateUser = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        const { getContentTypeInputName, getEntityResponseName } = strapi.plugin('graphql').service('utils').naming;
        const userContentType = strapi.getModel(usersPermissionsUserUID);
        const userInputName = getContentTypeInputName(userContentType);
        const responseName = getEntityResponseName(userContentType);
        return {
            type: nonNull(responseName),
            args: {
                id: nonNull('ID'),
                data: nonNull(userInputName)
            },
            description: 'Update an existing user',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.params = {
                    id: args.id
                };
                koaContext.request.body = toPlainObject(args.data);
                await strapi.plugin('users-permissions').controller('user').update(koaContext);
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
    return updateUser;
}

exports.__require = requireUpdateUser;
//# sourceMappingURL=update-user.js.map
