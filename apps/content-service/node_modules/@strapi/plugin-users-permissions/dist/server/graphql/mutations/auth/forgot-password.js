'use strict';

var require$$0 = require('lodash/fp');
var utils = require('../../utils.js');

var forgotPassword;
var hasRequiredForgotPassword;
function requireForgotPassword() {
    if (hasRequiredForgotPassword) return forgotPassword;
    hasRequiredForgotPassword = 1;
    const { toPlainObject } = require$$0;
    const { checkBadRequest } = utils.__require();
    forgotPassword = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        return {
            type: 'UsersPermissionsPasswordPayload',
            args: {
                email: nonNull('String')
            },
            description: 'Request a reset password token',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.request.body = toPlainObject(args);
                await strapi.plugin('users-permissions').controller('auth').forgotPassword(koaContext);
                const output = koaContext.body;
                checkBadRequest(output);
                return {
                    ok: output.ok || output
                };
            }
        };
    };
    return forgotPassword;
}

exports.__require = requireForgotPassword;
//# sourceMappingURL=forgot-password.js.map
