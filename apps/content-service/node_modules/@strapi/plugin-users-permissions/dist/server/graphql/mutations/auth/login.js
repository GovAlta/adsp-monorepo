'use strict';

var require$$0 = require('lodash/fp');
var utils = require('../../utils.js');

var login;
var hasRequiredLogin;
function requireLogin() {
    if (hasRequiredLogin) return login;
    hasRequiredLogin = 1;
    const { toPlainObject } = require$$0;
    const { checkBadRequest } = utils.__require();
    login = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        return {
            type: nonNull('UsersPermissionsLoginPayload'),
            args: {
                input: nonNull('UsersPermissionsLoginInput')
            },
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.params = {
                    provider: args.input.provider
                };
                koaContext.request.body = toPlainObject(args.input);
                await strapi.plugin('users-permissions').controller('auth').callback(koaContext);
                const output = koaContext.body;
                checkBadRequest(output);
                return {
                    user: output.user || output,
                    jwt: output.jwt
                };
            }
        };
    };
    return login;
}

exports.__require = requireLogin;
//# sourceMappingURL=login.js.map
