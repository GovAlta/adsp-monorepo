import require$$0 from 'lodash/fp';
import { __require as requireUtils } from '../../../utils.mjs';

var createUser;
var hasRequiredCreateUser;
function requireCreateUser() {
    if (hasRequiredCreateUser) return createUser;
    hasRequiredCreateUser = 1;
    const { toPlainObject } = require$$0;
    const { checkBadRequest } = requireUtils();
    const usersPermissionsUserUID = 'plugin::users-permissions.user';
    createUser = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        const { getContentTypeInputName, getEntityResponseName } = strapi.plugin('graphql').service('utils').naming;
        const userContentType = strapi.getModel(usersPermissionsUserUID);
        const userInputName = getContentTypeInputName(userContentType);
        const responseName = getEntityResponseName(userContentType);
        return {
            type: nonNull(responseName),
            args: {
                data: nonNull(userInputName)
            },
            description: 'Create a new user',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.params = {};
                koaContext.request.body = toPlainObject(args.data);
                await strapi.plugin('users-permissions').controller('user').create(koaContext);
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
    return createUser;
}

export { requireCreateUser as __require };
//# sourceMappingURL=create-user.mjs.map
