import require$$0 from 'lodash/fp';
import { __require as requireUtils } from '../../utils.mjs';

var forgotPassword;
var hasRequiredForgotPassword;
function requireForgotPassword() {
    if (hasRequiredForgotPassword) return forgotPassword;
    hasRequiredForgotPassword = 1;
    const { toPlainObject } = require$$0;
    const { checkBadRequest } = requireUtils();
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

export { requireForgotPassword as __require };
//# sourceMappingURL=forgot-password.mjs.map
