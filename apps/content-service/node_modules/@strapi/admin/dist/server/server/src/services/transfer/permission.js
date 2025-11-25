'use strict';

var permissions = require('@strapi/permissions');
var utils = require('@strapi/utils');

const DEFAULT_TRANSFER_ACTIONS = [
    'push',
    'pull'
];
const providers = {
    action: utils.providerFactory(),
    condition: utils.providerFactory()
};
DEFAULT_TRANSFER_ACTIONS.forEach((action)=>{
    providers.action.register(action, {
        action
    });
});
const engine = permissions.engine.new({
    providers
});

exports.engine = engine;
exports.providers = providers;
//# sourceMappingURL=permission.js.map
