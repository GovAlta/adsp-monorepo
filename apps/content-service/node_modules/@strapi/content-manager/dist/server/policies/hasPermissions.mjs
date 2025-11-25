import { policy } from '@strapi/utils';
import { validateHasPermissionsInput } from '../validation/policies/hasPermissions.mjs';

const { createPolicy } = policy;
var hasPermissions = createPolicy({
    name: 'plugin::content-manager.hasPermissions',
    validator: validateHasPermissionsInput,
    /**
   * NOTE: Action aliases are currently not checked at this level (policy).
   *       This is currently the intended behavior to avoid changing the behavior of API related permissions.
   *       If you want to add support for it, please create a dedicated RFC with a list of potential side effect this could have.
   */ handler (ctx, config = {}) {
        const { actions = [], hasAtLeastOne = false } = config;
        const { userAbility } = ctx.state;
        const { model } = ctx.params;
        const isAuthorized = hasAtLeastOne ? actions.some((action)=>userAbility.can(action, model)) : actions.every((action)=>userAbility.can(action, model));
        return isAuthorized;
    }
});

export { hasPermissions as default };
//# sourceMappingURL=hasPermissions.mjs.map
