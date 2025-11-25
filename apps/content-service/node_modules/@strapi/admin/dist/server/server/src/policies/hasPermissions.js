'use strict';

var _ = require('lodash');
var utils = require('@strapi/utils');
var hasPermissions$1 = require('../validation/policies/hasPermissions.js');

const { createPolicy } = utils.policy;
const inputModifiers = [
    {
        check: _.isString,
        transform: (action)=>({
                action
            })
    },
    {
        check: _.isArray,
        transform: (arr)=>({
                action: arr[0],
                subject: arr[1]
            })
    },
    {
        // Has to be after the isArray check since _.isObject also matches arrays
        check: _.isObject,
        transform: (perm)=>perm
    }
];
var hasPermissions = createPolicy({
    name: 'admin::hasPermissions',
    validator: hasPermissions$1.validateHasPermissionsInput,
    handler (ctx, config) {
        const { actions } = config;
        const { userAbility: ability } = ctx.state;
        const permissions = actions.map((action)=>inputModifiers.find((modifier)=>modifier.check(action))?.transform(action));
        const isAuthorized = permissions.every(({ action, subject })=>ability.can(action, subject));
        return isAuthorized;
    }
});

module.exports = hasPermissions;
//# sourceMappingURL=hasPermissions.js.map
