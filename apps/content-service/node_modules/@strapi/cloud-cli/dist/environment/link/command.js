'use strict';

var helpers = require('../../utils/helpers.js');
var action = require('./action.js');
var command$1 = require('../command.js');

const command = ({ command, ctx })=>{
    const environmentCmd = command$1.initializeEnvironmentCommand(command, ctx);
    environmentCmd.command('link').description('Link project to a specific Strapi Cloud project environment').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>helpers.runAction('link', action)(ctx));
};

module.exports = command;
//# sourceMappingURL=command.js.map
