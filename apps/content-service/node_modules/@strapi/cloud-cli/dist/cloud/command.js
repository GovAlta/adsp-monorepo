'use strict';

var helpers = require('../utils/helpers.js');
var action = require('../environment/list/action.js');

function defineCloudNamespace(command, ctx) {
    const cloud = command.command('cloud').description('Manage Strapi Cloud projects');
    // Define cloud namespace aliases:
    cloud.command('environments').description('Alias for cloud environment list').action(()=>helpers.runAction('list', action)(ctx));
    return cloud;
}

exports.defineCloudNamespace = defineCloudNamespace;
//# sourceMappingURL=command.js.map
