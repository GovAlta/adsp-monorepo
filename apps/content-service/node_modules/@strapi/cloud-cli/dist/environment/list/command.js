'use strict';

var helpers = require('../../utils/helpers.js');
var action = require('./action.js');
var command$1 = require('../command.js');

const command = ({ command, ctx })=>{
    const environmentCmd = command$1.initializeEnvironmentCommand(command, ctx);
    environmentCmd.command('list').description('List Strapi Cloud project environments').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>helpers.runAction('list', action)(ctx));
};

module.exports = command;
//# sourceMappingURL=command.js.map
