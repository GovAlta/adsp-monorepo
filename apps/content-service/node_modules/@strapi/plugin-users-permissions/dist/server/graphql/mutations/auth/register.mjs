import require$$0 from 'lodash/fp';
import { __require as requireUtils } from '../../utils.mjs';

var register;
var hasRequiredRegister;
function requireRegister() {
    if (hasRequiredRegister) return register;
    hasRequiredRegister = 1;
    const { toPlainObject } = require$$0;
    const { checkBadRequest } = requireUtils();
    register = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        return {
            type: nonNull('UsersPermissionsLoginPayload'),
            args: {
                input: nonNull('UsersPermissionsRegisterInput')
            },
            description: 'Register a user',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.request.body = toPlainObject(args.input);
                await strapi.plugin('users-permissions').controller('auth').register(koaContext);
                const output = koaContext.body;
                checkBadRequest(output);
                return {
                    user: output.user || output,
                    jwt: output.jwt
                };
            }
        };
    };
    return register;
}

export { requireRegister as __require };
//# sourceMappingURL=register.mjs.map
