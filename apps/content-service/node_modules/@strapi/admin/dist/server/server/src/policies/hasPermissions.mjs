import ___default from 'lodash';
import { policy } from '@strapi/utils';
import { validateHasPermissionsInput } from '../validation/policies/hasPermissions.mjs';

const { createPolicy } = policy;
const inputModifiers = [
    {
        check: ___default.isString,
        transform: (action)=>({
                action
            })
    },
    {
        check: ___default.isArray,
        transform: (arr)=>({
                action: arr[0],
                subject: arr[1]
            })
    },
    {
        // Has to be after the isArray check since _.isObject also matches arrays
        check: ___default.isObject,
        transform: (perm)=>perm
    }
];
var hasPermissions = createPolicy({
    name: 'admin::hasPermissions',
    validator: validateHasPermissionsInput,
    handler (ctx, config) {
        const { actions } = config;
        const { userAbility: ability } = ctx.state;
        const permissions = actions.map((action)=>inputModifiers.find((modifier)=>modifier.check(action))?.transform(action));
        const isAuthorized = permissions.every(({ action, subject })=>ability.can(action, subject));
        return isAuthorized;
    }
});

export { hasPermissions as default };
//# sourceMappingURL=hasPermissions.mjs.map
