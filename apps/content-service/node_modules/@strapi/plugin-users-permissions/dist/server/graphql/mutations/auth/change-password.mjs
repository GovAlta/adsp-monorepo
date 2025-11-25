import require$$0 from 'lodash/fp';
import { __require as requireUtils } from '../../utils.mjs';

var changePassword;
var hasRequiredChangePassword;
function requireChangePassword() {
    if (hasRequiredChangePassword) return changePassword;
    hasRequiredChangePassword = 1;
    const { toPlainObject } = require$$0;
    const { checkBadRequest } = requireUtils();
    changePassword = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        return {
            type: 'UsersPermissionsLoginPayload',
            args: {
                currentPassword: nonNull('String'),
                password: nonNull('String'),
                passwordConfirmation: nonNull('String')
            },
            description: 'Change user password. Confirm with the current password.',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.request.body = toPlainObject(args);
                await strapi.plugin('users-permissions').controller('auth').changePassword(koaContext);
                const output = koaContext.body;
                checkBadRequest(output);
                return {
                    user: output.user || output,
                    jwt: output.jwt
                };
            }
        };
    };
    return changePassword;
}

export { requireChangePassword as __require };
//# sourceMappingURL=change-password.mjs.map
