import { __require as requireMe } from './me.mjs';
import { __require as requireMeRole } from './me-role.mjs';
import { __require as requireRegisterInput } from './register-input.mjs';
import { __require as requireLoginInput } from './login-input.mjs';
import { __require as requirePasswordPayload } from './password-payload.mjs';
import { __require as requireLoginPayload } from './login-payload.mjs';
import { __require as requireCreateRolePayload } from './create-role-payload.mjs';
import { __require as requireUpdateRolePayload } from './update-role-payload.mjs';
import { __require as requireDeleteRolePayload } from './delete-role-payload.mjs';
import { __require as requireUserInput } from './user-input.mjs';

var types;
var hasRequiredTypes;
function requireTypes() {
    if (hasRequiredTypes) return types;
    hasRequiredTypes = 1;
    const typesFactories = [
        requireMe(),
        requireMeRole(),
        requireRegisterInput(),
        requireLoginInput(),
        requirePasswordPayload(),
        requireLoginPayload(),
        requireCreateRolePayload(),
        requireUpdateRolePayload(),
        requireDeleteRolePayload(),
        requireUserInput()
    ];
    /**
	 * @param {object} context
	 * @param {object} context.nexus
	 * @param {object} context.strapi
	 * @return {any[]}
	 */ types = (context)=>typesFactories.map((factory)=>factory(context));
    return types;
}

export { requireTypes as __require };
//# sourceMappingURL=index.mjs.map
