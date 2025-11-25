import require$$0 from 'lodash/fp';
import { __require as requireUtils } from '../../utils.mjs';

var resetPassword;
var hasRequiredResetPassword;
function requireResetPassword() {
    if (hasRequiredResetPassword) return resetPassword;
    hasRequiredResetPassword = 1;
    const { toPlainObject } = require$$0;
    const { checkBadRequest } = requireUtils();
    resetPassword = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        return {
            type: 'UsersPermissionsLoginPayload',
            args: {
                password: nonNull('String'),
                passwordConfirmation: nonNull('String'),
                code: nonNull('String')
            },
            description: 'Reset user password. Confirm with a code (resetToken from forgotPassword)',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.request.body = toPlainObject(args);
                await strapi.plugin('users-permissions').controller('auth').resetPassword(koaContext);
                const output = koaContext.body;
                checkBadRequest(output);
                return {
                    user: output.user || output,
                    jwt: output.jwt
                };
            }
        };
    };
    return resetPassword;
}

export { requireResetPassword as __require };
//# sourceMappingURL=reset-password.mjs.map
